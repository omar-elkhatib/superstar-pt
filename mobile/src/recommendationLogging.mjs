function getDayKey(isoString) {
  return String(isoString || "").slice(0, 10);
}

function hasTemplate(templates, templateId) {
  return Array.isArray(templates) && templates.some((template) => template.id === templateId);
}

function resolveRecommendedTemplateId(recommendation, templates) {
  const preferredTemplateId = recommendation?.recommendedTemplateId;
  if (preferredTemplateId && hasTemplate(templates, preferredTemplateId)) {
    return preferredTemplateId;
  }

  if (recommendation?.action === "progress" && hasTemplate(templates, "jogging")) {
    return "jogging";
  }

  if (hasTemplate(templates, "walking")) {
    return "walking";
  }

  return templates?.[0]?.id || "walking";
}

function resolveRecommendedVariant(recommendation) {
  return recommendation?.recommendedVariant || "base";
}

function resolveRecommendedDurationMinutes(recommendation) {
  if (Number.isFinite(Number(recommendation?.recommendedDurationMinutes))) {
    return Number(recommendation.recommendedDurationMinutes);
  }

  switch (recommendation?.action) {
    case "regress":
      return 15;
    case "progress":
      return 30;
    case "hold":
    default:
      return 20;
  }
}

function resolveRecommendedEffortScore(recommendation) {
  if (Number.isFinite(Number(recommendation?.recommendedEffortScore))) {
    return Number(recommendation.recommendedEffortScore);
  }

  switch (recommendation?.action) {
    case "regress":
      return 3;
    case "progress":
      return 6;
    case "hold":
    default:
      return 4;
  }
}

export function buildRecommendationLogDraft({
  recommendation,
  templates = []
} = {}) {
  return {
    templateId: resolveRecommendedTemplateId(recommendation, templates),
    durationMinutes: resolveRecommendedDurationMinutes(recommendation),
    effortScore: resolveRecommendedEffortScore(recommendation),
    variant: resolveRecommendedVariant(recommendation),
    completionStatus: "completed"
  };
}

export function resolveEntryRecommendation({
  explicitRecommendationId = null,
  nowIso = new Date().toISOString(),
  recommendationSnapshots = []
} = {}) {
  if (explicitRecommendationId) {
    return (
      recommendationSnapshots.find((snapshot) => snapshot.id === explicitRecommendationId) || null
    );
  }

  const todayKey = getDayKey(nowIso);
  return recommendationSnapshots.find((snapshot) => snapshot.dayKey === todayKey) || null;
}

export function classifyRecommendationAdherence({
  entry,
  recommendation,
  templates = []
} = {}) {
  if (!entry || !recommendation) {
    return "modified";
  }

  const draft = buildRecommendationLogDraft({ recommendation, templates });
  const matchesDraft =
    entry.templateId === draft.templateId &&
    Number(entry.durationMinutes) === draft.durationMinutes &&
    Number(entry.effortScore) === draft.effortScore &&
    String(entry.variant || "base") === draft.variant &&
    String(entry.completionStatus || "completed") === draft.completionStatus;

  return matchesDraft ? "followed" : "modified";
}

export function buildRecommendationLinkedEntry({
  entry,
  recommendation,
  templates = [],
  nowIso = new Date().toISOString()
} = {}) {
  if (!entry || !recommendation) {
    return entry;
  }

  const adherenceStatus = classifyRecommendationAdherence({
    entry,
    recommendation,
    templates
  });

  return {
    ...entry,
    recommendationLink: {
      recommendationId: recommendation.id,
      dayKey: recommendation.dayKey || getDayKey(nowIso),
      adherenceStatus,
      linkedAtIso: nowIso
    }
  };
}

export function updateRecommendationSnapshotAdherence({
  snapshot,
  adherenceStatus = "pending",
  entryId = null,
  nowIso = new Date().toISOString()
} = {}) {
  const linkedEntryIds = Array.isArray(snapshot?.linkedEntryIds)
    ? snapshot.linkedEntryIds.filter((id) => typeof id === "string" && id.length > 0)
    : [];
  const nextLinkedEntryIds =
    entryId && !linkedEntryIds.includes(entryId) ? [...linkedEntryIds, entryId] : linkedEntryIds;

  return {
    ...snapshot,
    adherenceStatus,
    linkedEntryIds: nextLinkedEntryIds,
    lastLinkedEntryId: entryId || snapshot?.lastLinkedEntryId || null,
    skippedAtIso: adherenceStatus === "skipped" ? nowIso : null,
    updatedAtIso: nowIso
  };
}
