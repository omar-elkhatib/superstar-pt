const FLARE_UP_PAIN_THRESHOLD = 6;
const PAIN_DELTA_THRESHOLD = 2;
const LOW_HISTORY_SESSION_THRESHOLD = 2;

export function adaptSession({
  currentPain = 0,
  priorPain = 0,
  readiness = "medium",
  symptomWorsenedIn24h = false
} = {}) {
  const painDelta = currentPain - priorPain;
  const flareUp =
    currentPain > FLARE_UP_PAIN_THRESHOLD ||
    painDelta > PAIN_DELTA_THRESHOLD ||
    symptomWorsenedIn24h;

  if (flareUp) {
    return {
      action: "regress",
      intensityMultiplier: 0.6,
      recommendation:
        "Switch to low-load alternatives and prioritize recovery today."
    };
  }

  if (readiness === "low") {
    return {
      action: "hold",
      intensityMultiplier: 0.8,
      recommendation: "Keep structure but reduce intensity and volume."
    };
  }

  if (readiness === "high") {
    return {
      action: "progress",
      intensityMultiplier: 1.05,
      recommendation: "Progress load slightly if form and symptoms stay stable."
    };
  }

  return {
    action: "hold",
    intensityMultiplier: 1,
    recommendation: "Keep plan unchanged and re-check after the session."
  };
}

function getDayKey(iso) {
  const [dayKey] = String(iso || "").split("T");
  return dayKey || "";
}

function buildVolumeGuidance(plan) {
  if (plan.overrideApplied && plan.action === "regress") {
    return "Reduce volume sharply and favor shorter, recovery-first work.";
  }

  if (plan.overrideApplied && plan.action === "hold") {
    return "Hold progression and keep volume steady until load risk settles.";
  }

  if (plan.action === "regress") {
    return "Cut volume to roughly half and prioritize symptom-calming work.";
  }

  if (plan.action === "progress") {
    return "Add volume slowly only if symptoms stay stable through the day.";
  }

  return plan.intensityMultiplier < 1
    ? "Keep the session short and technique-first today."
    : "Keep planned volume steady and re-check symptoms after training.";
}

function toActivityType(plan) {
  if (plan.action === "regress") {
    return "Recovery / technique";
  }

  if (plan.action === "progress") {
    return "Progressive training";
  }

  return "Base training";
}

export function buildDailyPlan({
  checkInInput,
  loadSummary,
  historySummary,
  baselineProfile,
  nowIso
}) {
  if (!checkInInput) {
    return null;
  }

  const baseRecommendation = adaptSession(checkInInput);
  const riskAdjustedPlan =
    loadSummary && historySummary?.hasRecentHistory
      ? {
          ...baseRecommendation,
          ...(loadSummary.overallRisk === "high"
            ? {
                action: "regress",
                intensityMultiplier: Math.min(baseRecommendation.intensityMultiplier, 0.7),
                recommendation: `High joint-load risk on ${
                  loadSummary?.topStressedJoints?.[0]?.jointId || "joint"
                }. Reduce load and prioritize recovery alternatives.`,
                overrideApplied: true,
                overrideReason: `high_risk_${loadSummary?.topStressedJoints?.[0]?.jointId || "joint"}`
              }
            : loadSummary.overallRisk === "moderate"
              ? {
                  action: baseRecommendation.action === "regress" ? "regress" : "hold",
                  intensityMultiplier: Math.min(baseRecommendation.intensityMultiplier, 0.9),
                  recommendation: `Moderate joint-load risk on ${
                    loadSummary?.topStressedJoints?.[0]?.jointId || "joint"
                  }. Hold progression and monitor tolerance.`,
                  overrideApplied: true,
                  overrideReason: `moderate_risk_${loadSummary?.topStressedJoints?.[0]?.jointId || "joint"}`
                }
              : {
                  overrideApplied: false,
                  overrideReason: null
                })
        }
      : {
          ...baseRecommendation,
          overrideApplied: false,
          overrideReason: null
        };

  const hasRecentHistory =
    historySummary?.hasRecentHistory ||
    Number(historySummary?.recentSessionCount || 0) >= LOW_HISTORY_SESSION_THRESHOLD;
  const needsLowHistoryFallback = !hasRecentHistory && riskAdjustedPlan.action === "progress";
  const finalPlan = needsLowHistoryFallback
    ? {
        ...riskAdjustedPlan,
        action: "hold",
        intensityMultiplier: Math.min(riskAdjustedPlan.intensityMultiplier, 0.85),
        recommendation:
          "Build from an easy session today while the app learns your recent baseline.",
        overrideApplied: false,
        overrideReason: "low_history_fallback"
      }
    : riskAdjustedPlan;

  return {
    id: `recommendation-${getDayKey(nowIso)}`,
    dayKey: getDayKey(nowIso),
    action: finalPlan.action,
    activityType: needsLowHistoryFallback ? "Recovery / technique" : toActivityType(finalPlan),
    intensityMultiplier: Number(finalPlan.intensityMultiplier.toFixed(2)),
    volumeGuidance: buildVolumeGuidance(finalPlan),
    summaryText: finalPlan.recommendation,
    sourceText: hasRecentHistory
      ? "Today's recommendation is based on your current check-in plus recent load."
      : baselineProfile?.completed && !baselineProfile?.skipped
        ? "Today's recommendation is based on your check-in and onboarding baseline because there isn't enough recent history yet."
        : "Today's recommendation is based on your check-in because there isn't enough recent history yet.",
    overallRisk: hasRecentHistory ? loadSummary?.overallRisk || "low" : "unknown",
    topJoint: hasRecentHistory ? loadSummary?.topStressedJoints?.[0]?.jointId || null : null,
    recentSessionCount: Number(historySummary?.recentSessionCount || 0),
    isLowHistoryFallback: !hasRecentHistory,
    overrideApplied: Boolean(finalPlan.overrideApplied),
    overrideReason: finalPlan.overrideReason || null
  };
}
