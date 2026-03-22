import { getEntryActivityLabel, resolveTemplateForEntry } from "../../activityEntryMetadata.mjs";
import {
  buildDailyLoadSeries,
  buildDailyRiskGuideFromSummary,
  buildRiskCategoryLegend,
  buildUnifiedLoadChart,
  computeEntryJointLoad,
  selectTopJointSeries,
  summarizeRollingLoad
} from "../../loadModel.mjs";
import { buildProgressSummary } from "../../viewModels/progressSummary.mjs";
import { buildProgressTimeline } from "../../viewModels/progressTimeline.mjs";

const LOAD_WINDOW_DAYS = 14;
const ACUTE_WINDOW_DAYS = 3;

export const DEFAULT_PROGRESS_SEGMENT = "timeline";

export const PROGRESS_SEGMENT_OPTIONS = [
  {
    value: "timeline",
    label: "Timeline",
    testID: "progress-segment-timeline"
  },
  {
    value: "load",
    label: "Load",
    testID: "progress-segment-load"
  }
];

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function capitalizeLabel(value, fallback = "") {
  const text = trimText(value);
  if (!text) {
    return fallback;
  }

  return text
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatUtcDateTime(isoString) {
  const iso = String(isoString || "");
  const dayKey = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  if (!dayKey || !time) {
    return "Unknown time";
  }
  return `${dayKey} ${time} UTC`;
}

function formatCompletionStatus(status) {
  switch (status) {
    case "partial":
      return "Partial";
    case "skipped":
      return "Skipped";
    case "completed":
    default:
      return "Completed";
  }
}

function formatAdherenceStatus(status) {
  switch (status) {
    case "followed":
      return "Followed";
    case "modified":
      return "Modified";
    case "skipped":
      return "Skipped";
    case "pending":
    default:
      return "Pending";
  }
}

function formatTopJointLoads(computed) {
  if (!computed?.byJoint) {
    return "No load details available.";
  }

  const topLoads = Object.entries(computed.byJoint)
    .map(([jointId, value]) => ({
      jointId,
      value: Number(value || 0)
    }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value)
    .slice(0, 3);

  if (topLoads.length === 0) {
    return "No load details available.";
  }

  return topLoads
    .map((item) => `${capitalizeLabel(item.jointId)} ${item.value >= 100 ? Math.round(item.value) : item.value.toFixed(1)}`)
    .join(" · ");
}

function resolveProgressSegment(value) {
  return value === "load" ? "load" : DEFAULT_PROGRESS_SEGMENT;
}

function buildTimelineSection({ checkIns, recommendationSnapshots, entries, followUpTasks, templates, nowIso, activeSegment }) {
  const timeline = buildProgressTimeline({
    checkIns,
    recommendationSnapshots,
    entries,
    followUpTasks,
    templates,
    nowIso
  });

  return {
    ...timeline,
    visible: activeSegment === "timeline",
    testID: "progress-timeline-list"
  };
}

function buildLoadSection({ entries, followUpTasks, recommendationSnapshots, templates, toleranceState, nowIso, activeSegment }) {
  void followUpTasks;
  void recommendationSnapshots;

  const loadSummary = summarizeRollingLoad({
    entries,
    templates,
    toleranceState,
    asOfIso: nowIso,
    windowDays: LOAD_WINDOW_DAYS,
    acuteDays: ACUTE_WINDOW_DAYS
  });
  const dailySeries = buildDailyLoadSeries({
    entries,
    templates,
    asOfIso: nowIso
  });
  const topJointIds = selectTopJointSeries({
    days: dailySeries.days,
    count: 3
  });
  const chart = buildUnifiedLoadChart({
    days: dailySeries.days,
    jointIds: topJointIds
  });
  const riskGuide = buildDailyRiskGuideFromSummary({
    loadSummary,
    jointIds: topJointIds.length > 0 ? topJointIds : undefined
  });
  const riskLegend = buildRiskCategoryLegend({ riskGuide });
  const overallRiskLabel = `${capitalizeLabel(loadSummary?.overallRisk, "Unknown")} load risk`;
  const topJointLabel = capitalizeLabel(
    loadSummary?.topStressedJoints?.[0]?.jointId || riskGuide?.referenceJointId,
    null
  );

  return {
    visible: activeSegment === "load",
    status: chart.days.length > 0 ? "ready" : "empty",
    testID: "progress-load-view",
    sectionTitle: "Load over time",
    sectionBody: "Review total and top-joint demand without recommendation history mixed into this view.",
    chart,
    topJointIds,
    overallRisk: loadSummary?.overallRisk || "unknown",
    overallRiskLabel,
    topJointLabel,
    referenceJointLabel: capitalizeLabel(riskGuide?.referenceJointId, null),
    riskGuide,
    riskLegend,
    emptyTitle: "No load trend yet",
    emptyBody: "Log a few sessions to unlock the rolling load chart and daily risk guide."
  };
}

function resolveLatestFollowUpForEntry(followUpTasks = [], entryId) {
  return [...followUpTasks]
    .filter((task) => task?.entryId === entryId)
    .sort((left, right) => {
      const leftAt = Date.parse(left?.completedAtIso || left?.updatedAtIso || left?.scheduledForIso || 0);
      const rightAt = Date.parse(right?.completedAtIso || right?.updatedAtIso || right?.scheduledForIso || 0);
      return rightAt - leftAt;
    })[0] || null;
}

function buildSessionDetail({ entries, selectedSessionId, templates, followUpTasks, recommendationSnapshots }) {
  const entry = entries.find((candidate) => candidate?.id === selectedSessionId) || null;
  if (!entry) {
    return {
      status: "closed",
      entryId: null
    };
  }

  const template = resolveTemplateForEntry({
    entry,
    templates
  });
  const computed = template ? computeEntryJointLoad(entry, template) : null;
  const recommendation = recommendationSnapshots.find(
    (snapshot) => snapshot?.id === entry?.recommendationLink?.recommendationId
  ) || null;
  const followUp = resolveLatestFollowUpForEntry(followUpTasks, entry.id);
  const activityLabel = getEntryActivityLabel({
    entry,
    templates
  }) || "Session";

  return {
    status: "open",
    entryId: entry.id,
    title: activityLabel,
    performedAtLabel: formatUtcDateTime(entry.performedAtIso),
    summaryText: `${Number(entry?.durationMinutes) || 0}m · effort ${Number(entry?.effortScore) || 0}/10 · ${formatCompletionStatus(entry?.completionStatus)}`,
    note: trimText(entry?.sessionNote),
    recommendationStatusLabel:
      recommendation || entry?.recommendationLink
        ? `Recommendation ${formatAdherenceStatus(entry?.recommendationLink?.adherenceStatus || recommendation?.adherenceStatus)}`
        : null,
    recommendationSummaryText: trimText(recommendation?.summaryText),
    followUpStatusLabel: followUp
      ? `Follow-up ${followUp.status === "completed" ? "completed" : "pending"}`
      : null,
    followUpSummaryText: followUp
      ? followUp.status === "completed"
        ? trimText(followUp?.outcome?.note) || `${capitalizeLabel(followUp?.outcome?.functionalImpact, "Completed")} response saved`
        : `Due ${formatUtcDateTime(followUp?.scheduledForIso)}`
      : "",
    loadSummaryText: formatTopJointLoads(computed)
  };
}

export function buildProgressScreenState({
  checkIns = [],
  recommendationSnapshots = [],
  entries = [],
  followUpTasks = [],
  templates = [],
  toleranceState,
  nowIso = new Date().toISOString(),
  selectedSegment = DEFAULT_PROGRESS_SEGMENT,
  selectedSessionId = null
} = {}) {
  const activeSegment = resolveProgressSegment(selectedSegment);
  const summary = buildProgressSummary({
    entries,
    followUpTasks,
    loadSummary: summarizeRollingLoad({
      entries,
      templates,
      toleranceState,
      asOfIso: nowIso,
      windowDays: LOAD_WINDOW_DAYS,
      acuteDays: ACUTE_WINDOW_DAYS
    }),
    recommendationSnapshots,
    nowIso
  });

  return {
    title: "Progress",
    activeSegment,
    segments: PROGRESS_SEGMENT_OPTIONS.map((segment) => ({
      ...segment,
      isSelected: segment.value === activeSegment
    })),
    summary: {
      ...summary,
      testID: "progress-summary",
      detailText: summary.topJointLabel
        ? `Top joint: ${summary.topJointLabel}`
        : "Log sessions to build a clearer load trend."
    },
    timeline: buildTimelineSection({
      checkIns,
      recommendationSnapshots,
      entries,
      followUpTasks,
      templates,
      nowIso,
      activeSegment
    }),
    load: buildLoadSection({
      entries,
      followUpTasks,
      recommendationSnapshots,
      templates,
      toleranceState,
      nowIso,
      activeSegment
    }),
    sessionDetail: buildSessionDetail({
      entries,
      selectedSessionId,
      templates,
      followUpTasks,
      recommendationSnapshots
    })
  };
}
