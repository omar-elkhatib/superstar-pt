import {
  buildDailyRecommendationInput,
  selectDailyHomeState
} from "../checkInModel.mjs";
import { buildDailyPlan } from "../adaptivePlan.mjs";
import { buildFollowUpInboxState } from "../followUpInbox.mjs";
import { selectFollowUpPrompt } from "../followUpModel.mjs";
import { summarizeRollingLoad } from "../loadModel.mjs";
import { buildRecommendationLogDraft } from "../recommendationLogging.mjs";

const LOAD_WINDOW_DAYS = 14;
const ACUTE_WINDOW_DAYS = 3;
const WEEKLY_WINDOW_DAYS = 7;
const RECENT_HISTORY_SESSION_THRESHOLD = 2;

function getDayKey(isoString) {
  return String(isoString || "").slice(0, 10);
}

function capitalizeLabel(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function formatJointLabel(jointId) {
  return jointId ? capitalizeLabel(jointId) : null;
}

function countRecentSessions(entries = [], nowIso, windowDays = WEEKLY_WINDOW_DAYS) {
  const nowAt = Date.parse(nowIso);
  if (!Number.isFinite(nowAt)) {
    return 0;
  }

  return entries.filter((entry) => {
    const performedAt = Date.parse(entry?.performedAtIso);
    if (!Number.isFinite(performedAt) || performedAt > nowAt) {
      return false;
    }

    const ageInDays = (nowAt - performedAt) / (1000 * 60 * 60 * 24);
    return ageInDays <= windowDays;
  }).length;
}

function resolveTodaySnapshot(recommendationSnapshots = [], nowIso) {
  const todayKey = getDayKey(nowIso);
  return recommendationSnapshots.find((snapshot) => snapshot?.dayKey === todayKey) || null;
}

function resolveMeaningfulTopJoint(loadSummary) {
  const candidate = loadSummary?.topStressedJoints?.[0] || null;
  return Number(candidate?.chronicLoad || 0) > 0 ? candidate.jointId : null;
}

function buildCheckInCard({ checkIns = [], nowIso }) {
  const homeState = selectDailyHomeState({ checkIns, nowIso });
  const isMissing = homeState.status === "missing";

  return {
    status: homeState.status,
    mode: homeState.mode,
    title: isMissing ? "Start Your Day" : "Today's Check-In",
    bodyText: isMissing
      ? "Log pain, readiness, and fatigue before you choose today's work."
      : "Today's condition is saved and ready to drive the recommendation.",
    ctaLabel: homeState.ctaLabel,
    emptyTitle: isMissing ? "No check-in saved for today." : null,
    emptyBody: isMissing
      ? "Start here so the app can tailor today's guidance before you add sessions."
      : null,
    summary: homeState.summary || null,
    checkIn: homeState.checkIn || null,
    updatedAtIso: homeState.checkIn?.updatedAtIso || null
  };
}

function buildRecommendationCard({
  checkIns = [],
  entries = [],
  recommendationSnapshots = [],
  templates = [],
  baselineProfile,
  nowIso,
  loadSummary
}) {
  const checkInInput = buildDailyRecommendationInput({ checkIns, nowIso });
  const recentSessionCount = countRecentSessions(entries, nowIso, LOAD_WINDOW_DAYS);
  const recommendation = buildDailyPlan({
    checkInInput,
    loadSummary,
    historySummary: {
      recentSessionCount,
      hasRecentHistory: recentSessionCount >= RECENT_HISTORY_SESSION_THRESHOLD
    },
    baselineProfile,
    nowIso
  });
  const snapshot = resolveTodaySnapshot(recommendationSnapshots, nowIso);

  if (!recommendation) {
    return {
      status: "locked",
      reason: "missing_check_in",
      title: "Suggested Session Guidance",
      sourceText: "Save today's check-in to tailor this guidance before training.",
      summaryText: "Save today's check-in to tailor today's guidance.",
      action: "hold",
      activityType: "Base training",
      intensityMultiplier: 1,
      volumeGuidance: "Save today's check-in to unlock guidance.",
      overallRisk: loadSummary?.overallRisk || "low",
      overallRiskLabel: `${capitalizeLabel(loadSummary?.overallRisk || "low")} load risk`,
      topJoint: null,
      topJointLabel: null,
      adherenceStatus: snapshot?.adherenceStatus || "pending",
      flags: {
        isLowHistoryFallback: false,
        overrideApplied: false
      },
      recommendationId: snapshot?.id || null,
      logPrefill: null,
      ctaLabel: "Start today's check-in",
      secondaryCtaLabel: null
    };
  }

  const topJoint = recommendation.topJoint || null;

  return {
    status: "ready",
    reason: null,
    title: "Suggested Session Guidance",
    sourceText: recommendation.sourceText,
    summaryText: recommendation.summaryText,
    action: recommendation.action,
    activityType: recommendation.activityType,
    intensityMultiplier: recommendation.intensityMultiplier,
    volumeGuidance: recommendation.volumeGuidance,
    overallRisk: recommendation.overallRisk || "low",
    overallRiskLabel: `${capitalizeLabel(recommendation.overallRisk || "low")} load risk`,
    topJoint,
    topJointLabel: formatJointLabel(topJoint),
    adherenceStatus: snapshot?.adherenceStatus || "pending",
    flags: {
      isLowHistoryFallback: Boolean(recommendation.isLowHistoryFallback),
      overrideApplied: Boolean(recommendation.overrideApplied)
    },
    recommendationId: snapshot?.id || recommendation.id,
    logPrefill: buildRecommendationLogDraft({
      recommendation: {
        ...recommendation,
        id: snapshot?.id || recommendation.id
      },
      templates
    }),
    ctaLabel: "Log recommended session",
    secondaryCtaLabel: "Skip today's plan"
  };
}

function buildFollowUpCard({ followUpTasks = [], entries = [], templates = [], nowIso }) {
  const prompt = selectFollowUpPrompt({
    tasks: followUpTasks,
    entries,
    templates,
    nowIso
  });
  const inboxState = buildFollowUpInboxState({
    tasks: followUpTasks,
    entries,
    templates,
    nowIso
  });

  if (prompt.status === "empty") {
    return {
      status: "empty",
      title: prompt.title,
      summaryText: prompt.summary,
      ctaLabel: null,
      taskId: null,
      entryId: null,
      remainingCount: 0,
      queueCount: 0,
      overdueCount: inboxState.overdueCount,
      pendingCount: inboxState.pendingCount,
      detailLabel: null,
      loggedAtLabel: null,
      timingLabel: null,
      scheduledLabel: null
    };
  }

  const promotedItem = inboxState.items.find((item) => item.taskId === prompt.task?.id) || null;

  return {
    status: promotedItem?.status || (prompt.isOverdue ? "overdue" : "pending"),
    title: prompt.title,
    summaryText: prompt.summary,
    ctaLabel: prompt.ctaLabel,
    taskId: prompt.task?.id || null,
    entryId: prompt.entry?.id || prompt.task?.entryId || null,
    remainingCount: Math.max(0, inboxState.totalCount - 1),
    queueCount: inboxState.totalCount,
    overdueCount: inboxState.overdueCount,
    pendingCount: inboxState.pendingCount,
    detailLabel: promotedItem?.detailLabel || null,
    loggedAtLabel: promotedItem?.loggedAtLabel || null,
    timingLabel: promotedItem?.timingLabel || null,
    scheduledLabel: promotedItem?.scheduledLabel || null
  };
}

function buildWeeklySummaryCard({ entries = [], nowIso, loadSummary }) {
  const sessionCount = countRecentSessions(entries, nowIso, WEEKLY_WINDOW_DAYS);
  const topJoint = resolveMeaningfulTopJoint(loadSummary);

  return {
    status: sessionCount > 0 ? "ready" : "empty",
    title: "Weekly Summary",
    summaryText: `This week: ${sessionCount} sessions • ${loadSummary?.overallRisk || "low"} load risk`,
    sessionCount,
    risk: loadSummary?.overallRisk || "low",
    riskLabel: `${capitalizeLabel(loadSummary?.overallRisk || "low")} load risk`,
    topJoint,
    topJointLabel: formatJointLabel(topJoint),
    detailText:
      sessionCount > 0 && topJoint
        ? `Top stressed joint: ${formatJointLabel(topJoint)}`
        : "Log sessions this week to build your trend.",
    ctaLabel: "Open progress"
  };
}

function buildOnboardingState(baselineProfile) {
  const profile = baselineProfile && typeof baselineProfile === "object" ? baselineProfile : {};
  const completed = Boolean(profile.completed);
  const skipped = Boolean(profile.skipped);
  const visible = !completed && !skipped;

  return {
    status: completed ? "complete" : skipped ? "skipped" : "prompt",
    visible,
    title: "Quick Baseline",
    bodyText:
      "Add a little starting context so first-day guidance is less generic. You can skip this and use the app normally.",
    profile: {
      completed,
      skipped,
      goals: Array.isArray(profile.goals) ? profile.goals : [],
      activityLevel: typeof profile.activityLevel === "string" ? profile.activityLevel : "",
      sensitiveAreas: Array.isArray(profile.sensitiveAreas) ? profile.sensitiveAreas : []
    }
  };
}

// Screen-ready Today state for the new UI overhaul. Each card exposes explicit
// status and copy fields so the screen layer can render without recomputing
// domain rules inline.
export function buildTodayScreenState({
  checkIns = [],
  entries = [],
  followUpTasks = [],
  recommendationSnapshots = [],
  templates = [],
  toleranceState,
  baselineProfile,
  nowIso = new Date().toISOString()
} = {}) {
  const loadSummary = summarizeRollingLoad({
    entries,
    templates,
    toleranceState,
    asOfIso: nowIso,
    windowDays: LOAD_WINDOW_DAYS,
    acuteDays: ACUTE_WINDOW_DAYS
  });

  return {
    checkInCard: buildCheckInCard({ checkIns, nowIso }),
    recommendationCard: buildRecommendationCard({
      checkIns,
      entries,
      recommendationSnapshots,
      templates,
      baselineProfile,
      nowIso,
      loadSummary
    }),
    followUpCard: buildFollowUpCard({
      followUpTasks,
      entries,
      templates,
      nowIso
    }),
    weeklySummaryCard: buildWeeklySummaryCard({
      entries,
      nowIso,
      loadSummary
    }),
    onboarding: buildOnboardingState(baselineProfile)
  };
}
