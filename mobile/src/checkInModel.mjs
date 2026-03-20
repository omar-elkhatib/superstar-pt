function toDateParts(iso) {
  const [dayKey] = String(iso || "").split("T");
  return dayKey || "";
}

export function getDayKey(iso) {
  return toDateParts(iso);
}

export function resolveTodaysCheckIn({ checkIns, nowIso }) {
  const dayKey = getDayKey(nowIso);
  return checkIns.find((checkIn) => checkIn.dayKey === dayKey) || null;
}

export function saveDailyCheckInRecord({ checkIns, values, nowIso }) {
  const dayKey = getDayKey(nowIso);
  const existing = checkIns.find((checkIn) => checkIn.dayKey === dayKey) || null;
  const nextRecord = {
    id: existing?.id || `checkin-${dayKey}`,
    dayKey,
    createdAtIso: existing?.createdAtIso || nowIso,
    updatedAtIso: nowIso,
    painScore: Number(values.painScore) || 0,
    readinessScore: Number(values.readinessScore) || 0,
    fatigueScore: Number(values.fatigueScore) || 0,
    note: values.note?.trim() || ""
  };

  const remaining = checkIns.filter((checkIn) => checkIn.dayKey !== dayKey);
  const saved = [...remaining, nextRecord].sort((a, b) => {
    return Date.parse(b.updatedAtIso) - Date.parse(a.updatedAtIso);
  });

  return {
    saved,
    record: nextRecord
  };
}

function scoreToReadiness(score) {
  if (score <= 3) {
    return "low";
  }
  if (score >= 8) {
    return "high";
  }
  return "medium";
}

export function buildDailyRecommendationInput({ checkIns, nowIso }) {
  const today = resolveTodaysCheckIn({ checkIns, nowIso });
  if (!today) {
    return null;
  }

  const previous = checkIns
    .filter((checkIn) => checkIn.dayKey < today.dayKey)
    .sort((a, b) => b.dayKey.localeCompare(a.dayKey))[0];

  return {
    currentPain: today.painScore,
    priorPain: previous?.painScore ?? today.painScore,
    readiness: scoreToReadiness(today.readinessScore),
    symptomWorsenedIn24h: today.fatigueScore >= 7 || today.painScore - (previous?.painScore ?? today.painScore) >= 2
  };
}

export function selectDailyHomeState({ checkIns, nowIso }) {
  const today = resolveTodaysCheckIn({ checkIns, nowIso });
  if (!today) {
    return {
      status: "missing",
      mode: "create",
      ctaLabel: "Start today's check-in",
      summary: null
    };
  }

  return {
    status: "complete",
    mode: "edit",
    ctaLabel: "Edit today's check-in",
    summary: {
      painLabel: `Pain ${today.painScore}/10`,
      readinessLabel: `Readiness ${today.readinessScore}/10`,
      fatigueLabel: `Fatigue ${today.fatigueScore}/10`,
      note: today.note
    },
    checkIn: today
  };
}
