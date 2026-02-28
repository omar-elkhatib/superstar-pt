export const JOINT_IDS = [
  "ankle",
  "knee",
  "hip",
  "spine",
  "neck",
  "shoulder",
  "elbow",
  "wrist"
];

const MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
const INDIRECT_WEIGHT_FACTOR = 0.35;
const TOLERANCE_DEFAULT = 0.85;
const TOLERANCE_MIN = 0.6;
const TOLERANCE_MAX = 1.15;

function isInWindow(performedAtIso, asOfIso, days) {
  const performedTime = Date.parse(performedAtIso);
  const asOfTime = Date.parse(asOfIso);
  if (!Number.isFinite(performedTime) || !Number.isFinite(asOfTime)) {
    return false;
  }
  const delta = asOfTime - performedTime;
  return delta >= 0 && delta <= days * MILLIS_IN_DAY;
}

function toJointLoad(direct = 0, indirect = 0) {
  return direct + INDIRECT_WEIGHT_FACTOR * indirect;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export function createDefaultToleranceState() {
  const factors = {};
  const lastUpdatedIso = {};
  for (const jointId of JOINT_IDS) {
    factors[jointId] = TOLERANCE_DEFAULT;
    lastUpdatedIso[jointId] = null;
  }
  return { factors, lastUpdatedIso };
}

export function computeEntryJointLoad(entry, template) {
  const sessionLoad = Math.max(0, Number(entry.durationMinutes) || 0) * Math.max(0, Number(entry.effortScore) || 0);
  const variant = entry.variant || "base";
  const profile =
    template?.jointProfile?.[variant] || template?.jointProfile?.base || {};

  const byJoint = {};
  for (const jointId of JOINT_IDS) {
    const weight = profile[jointId] || { direct: 0, indirect: 0 };
    const effectiveWeight = toJointLoad(weight.direct, weight.indirect);
    byJoint[jointId] = Number((sessionLoad * effectiveWeight).toFixed(3));
  }

  return { sessionLoad, byJoint };
}

function toRisk(adjustedRatio) {
  if (adjustedRatio > 1.35) {
    return "high";
  }
  if (adjustedRatio > 1.15) {
    return "moderate";
  }
  return "low";
}

function riskPriority(risk) {
  if (risk === "high") {
    return 3;
  }
  if (risk === "moderate") {
    return 2;
  }
  return 1;
}

export function summarizeRollingLoad({
  entries,
  templates,
  toleranceState,
  asOfIso,
  windowDays = 14,
  acuteDays = 3
}) {
  const templateById = new Map(templates.map((item) => [item.id, item]));
  const byJoint = {};

  for (const jointId of JOINT_IDS) {
    byJoint[jointId] = {
      acuteLoad: 0,
      chronicLoad: 0,
      ratio: 0,
      adjustedRatio: 0,
      risk: "low",
      toleranceFactor: toleranceState?.factors?.[jointId] ?? TOLERANCE_DEFAULT
    };
  }

  let totalBodyLoad = 0;
  const recentEntries = entries.filter((entry) => isInWindow(entry.performedAtIso, asOfIso, windowDays));

  for (const entry of recentEntries) {
    const template = templateById.get(entry.templateId);
    if (!template) {
      continue;
    }

    const computed = computeEntryJointLoad(entry, template);
    totalBodyLoad += computed.sessionLoad;

    for (const jointId of JOINT_IDS) {
      const value = computed.byJoint[jointId] || 0;
      byJoint[jointId].chronicLoad += value;
      if (isInWindow(entry.performedAtIso, asOfIso, acuteDays)) {
        byJoint[jointId].acuteLoad += value;
      }
    }
  }

  for (const jointId of JOINT_IDS) {
    const joint = byJoint[jointId];
    const chronicEquivalent = (joint.chronicLoad / windowDays) * acuteDays;
    joint.ratio = chronicEquivalent > 0 ? joint.acuteLoad / chronicEquivalent : 0;
    joint.adjustedRatio = joint.ratio / Math.max(joint.toleranceFactor, 0.01);
    joint.risk = toRisk(joint.adjustedRatio);

    joint.acuteLoad = Number(joint.acuteLoad.toFixed(3));
    joint.chronicLoad = Number(joint.chronicLoad.toFixed(3));
    joint.ratio = Number(joint.ratio.toFixed(3));
    joint.adjustedRatio = Number(joint.adjustedRatio.toFixed(3));
  }

  const topStressedJoints = [...JOINT_IDS]
    .sort((a, b) => byJoint[b].chronicLoad - byJoint[a].chronicLoad)
    .slice(0, 2)
    .map((jointId) => ({
      jointId,
      chronicLoad: byJoint[jointId].chronicLoad,
      risk: byJoint[jointId].risk
    }));

  const overallRisk = [...JOINT_IDS]
    .map((jointId) => byJoint[jointId].risk)
    .sort((a, b) => riskPriority(b) - riskPriority(a))[0] || "low";

  const riskByJoint = {};
  for (const jointId of JOINT_IDS) {
    riskByJoint[jointId] = byJoint[jointId].risk;
  }

  return {
    byJoint,
    riskByJoint,
    overallRisk,
    totalBodyLoad: Number(totalBodyLoad.toFixed(3)),
    topStressedJoints
  };
}

export function updateToleranceFromFeedback({ toleranceState, entries, asOfIso }) {
  const next = {
    factors: { ...(toleranceState?.factors || {}) },
    lastUpdatedIso: { ...(toleranceState?.lastUpdatedIso || {}) }
  };

  for (const jointId of JOINT_IDS) {
    if (next.factors[jointId] == null) {
      next.factors[jointId] = TOLERANCE_DEFAULT;
    }
    if (!(jointId in next.lastUpdatedIso)) {
      next.lastUpdatedIso[jointId] = null;
    }

    const lastUpdated = next.lastUpdatedIso[jointId];
    if (lastUpdated && isInWindow(lastUpdated, asOfIso, 7)) {
      continue;
    }

    const values = [];
    for (const entry of entries) {
      if (!entry.jointFeedback || !isInWindow(entry.performedAtIso, asOfIso, 7)) {
        continue;
      }
      const value = entry.jointFeedback[jointId];
      if (typeof value === "number") {
        values.push(value);
      }
    }

    if (values.length === 0) {
      continue;
    }

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const anyHigh = values.some((value) => value >= 7);
    let delta = 0;

    if (average <= 2 && !values.some((value) => value >= 5)) {
      delta = 0.03;
    } else if (average >= 5 || anyHigh) {
      delta = -0.08;
    }

    next.factors[jointId] = clamp(next.factors[jointId] + delta, TOLERANCE_MIN, TOLERANCE_MAX);
    next.factors[jointId] = Number(next.factors[jointId].toFixed(3));
    next.lastUpdatedIso[jointId] = asOfIso;
  }

  return next;
}

export function buildAdaptiveRecommendation({ baseRecommendation, loadSummary }) {
  const topJoint = loadSummary?.topStressedJoints?.[0]?.jointId || "joint";

  if (loadSummary?.overallRisk === "high") {
    return {
      ...baseRecommendation,
      action: "regress",
      intensityMultiplier: Math.min(baseRecommendation.intensityMultiplier, 0.7),
      recommendation: `High joint-load risk on ${topJoint}. Reduce load and prioritize recovery alternatives.`,
      overrideApplied: true,
      overrideReason: `high_risk_${topJoint}`
    };
  }

  if (loadSummary?.overallRisk === "moderate") {
    const nextAction = baseRecommendation.action === "regress" ? "regress" : "hold";
    return {
      ...baseRecommendation,
      action: nextAction,
      intensityMultiplier: Math.min(baseRecommendation.intensityMultiplier, 0.9),
      recommendation: `Moderate joint-load risk on ${topJoint}. Hold progression and monitor tolerance.`,
      overrideApplied: true,
      overrideReason: `moderate_risk_${topJoint}`
    };
  }

  return {
    ...baseRecommendation,
    overrideApplied: false,
    overrideReason: null
  };
}
