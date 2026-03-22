import { getEntryActivityLabel } from "../activityEntryMetadata.mjs";

const EMPTY_TITLE = "No progress history yet";
const EMPTY_BODY = "Check-ins, recommendations, sessions, and follow-ups will appear here as you use the app.";

const TYPE_SORT_PRIORITY = {
  recommendation: 0,
  check_in: 1,
  session: 2,
  follow_up: 3
};

function toTitleLabel(value) {
  return String(value || "")
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveTimestamp(...isoStrings) {
  for (const isoString of isoStrings) {
    if (!isoString) {
      continue;
    }

    const parsed = Date.parse(isoString);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return null;
}

function buildCheckInSubtitle(checkIn) {
  const pain = Number(checkIn?.painScore);
  const readiness = Number(checkIn?.readinessScore);
  const fatigue = Number(checkIn?.fatigueScore);

  return `Pain ${Number.isFinite(pain) ? pain : "?"} · Ready ${
    Number.isFinite(readiness) ? readiness : "?"
  } · Fatigue ${Number.isFinite(fatigue) ? fatigue : "?"}`;
}

function buildSessionSubtitle(entry, templates) {
  const activityLabel = getEntryActivityLabel({ entry, templates }) || "Session";
  const durationLabel = Number.isFinite(Number(entry?.durationMinutes))
    ? `${Number(entry.durationMinutes)}m`
    : "duration unknown";
  const effortLabel = Number.isFinite(Number(entry?.effortScore))
    ? `effort ${Number(entry.effortScore)}/10`
    : "effort N/A";

  return `${activityLabel} · ${durationLabel} · ${effortLabel}`;
}

function buildCompletedFollowUpSubtitle(task) {
  const functionalImpact = trimText(task?.outcome?.functionalImpact);
  if (functionalImpact) {
    return `${toTitleLabel(functionalImpact)} function`;
  }

  const appropriateness = trimText(task?.outcome?.appropriateness);
  if (appropriateness) {
    return toTitleLabel(appropriateness);
  }

  return `${Number(task?.windowHours) || 24}h follow-up saved`;
}

function buildCompletedFollowUpDetail(task) {
  const note = trimText(task?.outcome?.note);
  if (note) {
    return note;
  }

  const painResponse = Number(task?.outcome?.painResponse);
  const fatigueResponse = Number(task?.outcome?.fatigueResponse);
  if (Number.isFinite(painResponse) || Number.isFinite(fatigueResponse)) {
    return `Pain ${Number.isFinite(painResponse) ? painResponse : "?"}/10 · Fatigue ${
      Number.isFinite(fatigueResponse) ? fatigueResponse : "?"
    }/10`;
  }

  return "";
}

function buildPendingFollowUpSubtitle(task, entry, templates, nowIso) {
  const activityLabel = getEntryActivityLabel({ entry, templates }) || "Session";
  const scheduledAt = Date.parse(task?.scheduledForIso);
  const nowAt = Date.parse(nowIso);
  const statusLabel =
    Number.isFinite(scheduledAt) && Number.isFinite(nowAt) && scheduledAt <= nowAt
      ? "overdue"
      : "scheduled";

  return `${activityLabel} · ${Number(task?.windowHours) || 24}h check-in ${statusLabel}`;
}

function buildFollowUpDetail(task) {
  const completedDetail = buildCompletedFollowUpDetail(task);
  if (completedDetail) {
    return completedDetail;
  }

  const scheduledForIso = trimText(task?.scheduledForIso);
  return scheduledForIso ? `Due ${scheduledForIso}` : "";
}

function createTimelineItem(item) {
  if (!item.timestampIso) {
    return null;
  }

  return {
    id: item.id,
    type: item.type,
    timestampIso: item.timestampIso,
    title: item.title,
    subtitle: item.subtitle,
    detail: item.detail,
    linkedEntityId: item.linkedEntityId
  };
}

function buildCheckInItem(checkIn) {
  return createTimelineItem({
    id: `check_in:${checkIn?.id || checkIn?.dayKey || "unknown"}`,
    type: "check_in",
    timestampIso: resolveTimestamp(
      checkIn?.updatedAtIso,
      checkIn?.createdAtIso,
      checkIn?.dayKey ? `${checkIn.dayKey}T00:00:00.000Z` : null
    ),
    title: "Check-in",
    subtitle: buildCheckInSubtitle(checkIn),
    detail: trimText(checkIn?.note),
    linkedEntityId: checkIn?.id || null
  });
}

function buildRecommendationItem(snapshot) {
  return createTimelineItem({
    id: `recommendation:${snapshot?.id || snapshot?.dayKey || "unknown"}`,
    type: "recommendation",
    timestampIso: resolveTimestamp(
      snapshot?.updatedAtIso,
      snapshot?.createdAtIso,
      snapshot?.dayKey ? `${snapshot.dayKey}T00:00:00.000Z` : null
    ),
    title: "Recommendation",
    subtitle: trimText(snapshot?.summaryText) || trimText(snapshot?.volumeGuidance) || "Plan updated",
    detail: trimText(snapshot?.sourceText) || trimText(snapshot?.activityType),
    linkedEntityId: snapshot?.id || null
  });
}

function buildSessionItem(entry, templates) {
  return createTimelineItem({
    id: `session:${entry?.id || "unknown"}`,
    type: "session",
    timestampIso: resolveTimestamp(entry?.performedAtIso, entry?.createdAtIso, entry?.updatedAtIso),
    title: "Session",
    subtitle: buildSessionSubtitle(entry, templates),
    detail: trimText(entry?.sessionNote),
    linkedEntityId: entry?.id || null
  });
}

function buildFollowUpItem(task, entry, templates, nowIso) {
  const isCompleted = task?.status === "completed";
  return createTimelineItem({
    id: `follow_up:${task?.id || "unknown"}`,
    type: "follow_up",
    timestampIso: resolveTimestamp(
      isCompleted ? task?.completedAtIso : null,
      task?.updatedAtIso,
      task?.scheduledForIso
    ),
    title: "Follow-up",
    subtitle: isCompleted
      ? buildCompletedFollowUpSubtitle(task)
      : buildPendingFollowUpSubtitle(task, entry, templates, nowIso),
    detail: buildFollowUpDetail(task),
    linkedEntityId: task?.id || null
  });
}

export function buildProgressTimeline({
  checkIns = [],
  recommendationSnapshots = [],
  entries = [],
  followUpTasks = [],
  templates = [],
  nowIso = new Date().toISOString()
} = {}) {
  const entryById = new Map((entries || []).map((entry) => [entry.id, entry]));
  const items = [
    ...(checkIns || []).map((checkIn) => buildCheckInItem(checkIn)),
    ...(recommendationSnapshots || []).map((snapshot) => buildRecommendationItem(snapshot)),
    ...(entries || []).map((entry) => buildSessionItem(entry, templates)),
    ...(followUpTasks || []).map((task) =>
      buildFollowUpItem(task, entryById.get(task?.entryId) || null, templates, nowIso)
    )
  ]
    .filter(Boolean)
    .sort((left, right) => {
      const timestampDiff = Date.parse(right.timestampIso) - Date.parse(left.timestampIso);
      if (timestampDiff !== 0) {
        return timestampDiff;
      }

      const typeDiff =
        (TYPE_SORT_PRIORITY[left.type] ?? Number.MAX_SAFE_INTEGER) -
        (TYPE_SORT_PRIORITY[right.type] ?? Number.MAX_SAFE_INTEGER);
      if (typeDiff !== 0) {
        return typeDiff;
      }

      return left.id.localeCompare(right.id);
    });

  return {
    items,
    emptyTitle: EMPTY_TITLE,
    emptyBody: EMPTY_BODY
  };
}
