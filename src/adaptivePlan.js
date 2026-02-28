const FLARE_UP_PAIN_THRESHOLD = 6;
const PAIN_DELTA_THRESHOLD = 2;

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
        "Switch to low-load alternatives, reduce range if needed, and prioritize recovery."
    };
  }

  if (readiness === "low") {
    return {
      action: "hold",
      intensityMultiplier: 0.8,
      recommendation: "Keep plan structure, but reduce volume and intensity for today."
    };
  }

  if (readiness === "high") {
    return {
      action: "progress",
      intensityMultiplier: 1.05,
      recommendation: "Progress load slightly while keeping form and symptom response monitored."
    };
  }

  return {
    action: "hold",
    intensityMultiplier: 1,
    recommendation: "Keep plan unchanged and re-evaluate after session feedback."
  };
}

