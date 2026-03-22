const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
const WEEK_WINDOW_DAYS = 7;

function toTitleLabel(value, fallback = "Unknown") {
  const source = String(value || "").trim();
  if (!source) {
    return fallback;
  }

  return source
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function countWeeklySessions(entries, nowIso) {
  const nowAt = Date.parse(nowIso);
  if (!Number.isFinite(nowAt)) {
    return 0;
  }

  return (entries || []).filter((entry) => {
    const performedAt = Date.parse(entry?.performedAtIso);
    if (!Number.isFinite(performedAt) || performedAt > nowAt) {
      return false;
    }

    return nowAt - performedAt <= WEEK_WINDOW_DAYS * MILLIS_IN_DAY;
  }).length;
}

function resolveTopJointLabel(loadSummary) {
  const topJointId = loadSummary?.topStressedJoints?.[0]?.jointId || loadSummary?.topJoint || null;
  return topJointId ? toTitleLabel(topJointId, null) : null;
}

export function buildProgressSummary({
  entries = [],
  followUpTasks = [],
  loadSummary = null,
  recommendationSnapshots = [],
  nowIso = new Date().toISOString()
} = {}) {
  void followUpTasks;
  void recommendationSnapshots;

  const weeklySessionCount = countWeeklySessions(entries, nowIso);
  const riskLabel = toTitleLabel(loadSummary?.overallRisk, "Unknown");

  return {
    weeklySessionCount,
    riskLabel,
    summaryText: `This week: ${weeklySessionCount} sessions • ${riskLabel} load risk`,
    topJointLabel: resolveTopJointLabel(loadSummary)
  };
}
