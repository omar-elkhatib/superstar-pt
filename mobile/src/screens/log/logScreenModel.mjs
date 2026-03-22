import {
  CUSTOM_ACTIVITY_BODY_REGION_OPTIONS,
  CUSTOM_ACTIVITY_TEMPLATE_ID
} from "../../activityEntryMetadata.mjs";
import {
  buildRecommendationLinkedEntry,
  buildRecommendationLogDraft,
  resolveEntryRecommendation
} from "../../recommendationLogging.mjs";

const DEFAULT_TEMPLATE_ID = "walking";
const DEFAULT_DURATION_MINUTES = 20;
const DEFAULT_EFFORT_SCORE = 4;
const DEFAULT_PAIN_SCORE = 4;

export const LOG_PRIMARY_FIELD_IDS = [
  "activity",
  "variant",
  "duration",
  "effort",
  "completion",
  "pain"
];

export const LOG_OPTIONAL_FIELD_IDS = ["jointFeedback", "notes"];

export const LOG_MODE_OPTIONS = [
  {
    value: "recommended",
    label: "Recommended",
    testID: "log-mode-recommended"
  },
  {
    value: "manual",
    label: "Manual",
    testID: "log-mode-manual"
  }
];

export const LOG_VARIANT_OPTIONS = [
  { value: "base", label: "Base" },
  { value: "seated", label: "Seated" },
  { value: "supported", label: "Supported" }
];

export const LOG_COMPLETION_OPTIONS = [
  { value: "completed", label: "Completed" },
  { value: "partial", label: "Partial" },
  { value: "skipped", label: "Skipped" }
];

export const LOG_JOINT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "ankle", label: "Ankle" },
  { value: "knee", label: "Knee" },
  { value: "hip", label: "Hip" },
  { value: "spine", label: "Spine" },
  { value: "neck", label: "Neck" },
  { value: "shoulder", label: "Shoulder" },
  { value: "elbow", label: "Elbow" },
  { value: "wrist", label: "Wrist" }
];

function resolveTemplateFallback(templates = []) {
  return templates[0]?.id || DEFAULT_TEMPLATE_ID;
}

function resolveRecommendedTemplateLabel({ recommendation, templates = [] }) {
  const recommendedDraft = buildRecommendationLogDraft({
    recommendation,
    templates
  });

  return resolveTemplateLabel(recommendedDraft.templateId, templates);
}

function resolveTemplateLabel(templateId, templates = [], customActivityName = "") {
  if (templateId === CUSTOM_ACTIVITY_TEMPLATE_ID) {
    const trimmedName = String(customActivityName || "").trim();
    return trimmedName ? `Custom: ${trimmedName}` : "Custom activity";
  }

  return (
    templates.find((template) => template.id === templateId)?.name || templateId || "Activity"
  );
}

function resolveRecommendationForMode({
  mode = "manual",
  recommendation = null,
  recommendationSnapshots = [],
  nowIso = new Date().toISOString()
} = {}) {
  if (mode !== "recommended") {
    return null;
  }

  if (recommendation) {
    return recommendation;
  }

  return resolveEntryRecommendation({
    explicitRecommendationId: null,
    nowIso,
    recommendationSnapshots
  });
}

function buildActivityOptions(templates = []) {
  return [
    ...templates.map((template) => ({
      value: template.id,
      label: template.name
    })),
    {
      value: CUSTOM_ACTIVITY_TEMPLATE_ID,
      label: "Custom activity"
    }
  ];
}

function toStringValue(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return String(fallback);
  }

  return String(value);
}

function trimOptionalString(value) {
  const trimmed = String(value || "").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function buildDraftDefaults({
  mode = "manual",
  recommendation = null,
  templates = []
} = {}) {
  if (mode === "recommended" && recommendation) {
    return buildRecommendationLogDraft({
      recommendation,
      templates
    });
  }

  return {
    templateId: resolveTemplateFallback(templates),
    durationMinutes: DEFAULT_DURATION_MINUTES,
    effortScore: DEFAULT_EFFORT_SCORE,
    variant: "base",
    completionStatus: "completed"
  };
}

export function createLogDraft({
  mode = "manual",
  recommendation = null,
  recommendationSnapshots = [],
  nowIso = new Date().toISOString(),
  templates = [],
  painScore = DEFAULT_PAIN_SCORE,
  baseDraft = {}
} = {}) {
  const activeRecommendation = resolveRecommendationForMode({
    mode,
    recommendation,
    recommendationSnapshots,
    nowIso
  });
  const defaults = buildDraftDefaults({
    mode,
    recommendation: activeRecommendation,
    templates
  });

  return {
    mode,
    recommendationId:
      activeRecommendation?.id || (mode === "recommended" ? baseDraft.recommendationId || null : null),
    templateId: baseDraft.templateId || defaults.templateId,
    durationMinutes: toStringValue(baseDraft.durationMinutes, defaults.durationMinutes),
    effortScore: toStringValue(baseDraft.effortScore, defaults.effortScore),
    variant: String(baseDraft.variant || defaults.variant || "base"),
    completionStatus: String(baseDraft.completionStatus || defaults.completionStatus || "completed"),
    painScore: toStringValue(baseDraft.painScore, painScore),
    feedbackJoint: String(baseDraft.feedbackJoint || "none"),
    feedbackScore: String(baseDraft.feedbackScore || ""),
    sessionNote: String(baseDraft.sessionNote || ""),
    customActivityName: String(baseDraft.customActivityName || ""),
    customBodyRegion: String(baseDraft.customBodyRegion || "full_body"),
    customPrimaryJoint: String(baseDraft.customPrimaryJoint || "none")
  };
}

function buildPrefillCard({ mode, recommendation, draft, templates = [] }) {
  if (mode !== "recommended") {
    return {
      status: "hidden",
      title: null,
      summaryText: null,
      detailText: null
    };
  }

  if (!recommendation) {
    return {
      status: "locked",
      title: "No current recommendation",
      summaryText: "Save today's guidance from Today before using recommended mode.",
      detailText: "Manual logging is still available below."
    };
  }

  return {
    status: "ready",
    title: "Today's recommendation",
    summaryText:
      recommendation.summaryText ||
      recommendation.sourceText ||
      "Use the saved recommendation as your starting point.",
    detailText: `${resolveRecommendedTemplateLabel({
      recommendation,
      templates
    })} • ${draft.durationMinutes} min • effort ${draft.effortScore}`
  };
}

function buildCustomActivityFields(draft) {
  if (draft.templateId !== CUSTOM_ACTIVITY_TEMPLATE_ID) {
    return [];
  }

  return [
    {
      id: "customActivityName",
      label: "Custom activity name",
      value: draft.customActivityName
    },
    {
      id: "customBodyRegion",
      label: "Body region",
      value: draft.customBodyRegion,
      options: CUSTOM_ACTIVITY_BODY_REGION_OPTIONS.map((value) => ({
        value,
        label: value.replace(/_/g, " ")
      }))
    },
    {
      id: "customPrimaryJoint",
      label: "Primary joint",
      value: draft.customPrimaryJoint,
      options: LOG_JOINT_OPTIONS
    }
  ];
}

export function buildLogScreenState({
  mode = "manual",
  recommendation = null,
  recommendationSnapshots = [],
  nowIso = new Date().toISOString(),
  templates = [],
  painScore = DEFAULT_PAIN_SCORE,
  draft: existingDraft = {}
} = {}) {
  const activeRecommendation = resolveRecommendationForMode({
    mode,
    recommendation,
    recommendationSnapshots,
    nowIso
  });
  const draft = createLogDraft({
    mode,
    recommendation: activeRecommendation,
    templates,
    painScore,
    baseDraft: existingDraft
  });

  return {
    mode,
    title: "Log Session",
    subtitle:
      mode === "recommended"
        ? "Start from today's suggested session, then adjust only what actually changed."
        : "Capture what you did without forcing optional details into the first screenful.",
    modeOptions: LOG_MODE_OPTIONS.map((option) => ({
      ...option,
      isSelected: option.value === mode
    })),
    prefillCard: buildPrefillCard({
      mode,
      recommendation: activeRecommendation,
      draft,
      templates
    }),
    primaryFieldIds: [...LOG_PRIMARY_FIELD_IDS],
    optionalFieldIds: [...LOG_OPTIONAL_FIELD_IDS],
    activityOptions: buildActivityOptions(templates),
    variantOptions: [...LOG_VARIANT_OPTIONS],
    completionOptions: [...LOG_COMPLETION_OPTIONS],
    jointOptions: [...LOG_JOINT_OPTIONS],
    customActivityFields: buildCustomActivityFields(draft),
    fields: {
      activity: {
        label: "Activity",
        value: draft.templateId,
        summaryText: resolveTemplateLabel(draft.templateId, templates, draft.customActivityName)
      },
      variant: {
        label: "Variant",
        value: draft.variant
      },
      duration: {
        label: "Duration (minutes)",
        value: draft.durationMinutes
      },
      effort: {
        label: "Effort (1-10)",
        value: draft.effortScore
      },
      completion: {
        label: "Completion",
        value: draft.completionStatus
      },
      pain: {
        label: "Pain score (0-10)",
        value: draft.painScore
      },
      jointFeedback: {
        label: "Optional joint discomfort",
        value: draft.feedbackJoint,
        scoreValue: draft.feedbackScore
      },
      notes: {
        label: "Optional note",
        value: draft.sessionNote
      }
    },
    saveAction: {
      label: activeRecommendation && mode === "recommended" ? "Save recommended session" : "Save session",
      hint:
        mode === "recommended"
          ? "Recommended defaults stay linked so followed vs modified still classifies correctly."
          : "Optional discomfort and notes stay secondary to the main logging fields."
    },
    draft
  };
}

function resolveDraftRecommendation({
  draft,
  recommendation = null,
  recommendationSnapshots = [],
  nowIso = new Date().toISOString()
} = {}) {
  if (recommendation) {
    return recommendation;
  }

  if (!draft?.recommendationId) {
    return null;
  }

  return resolveEntryRecommendation({
    explicitRecommendationId: draft.recommendationId,
    nowIso,
    recommendationSnapshots
  });
}

function validateRequiredDraft(draft) {
  if (!draft?.templateId) {
    throw new Error("Select an exercise template.");
  }

  if (
    draft.templateId === CUSTOM_ACTIVITY_TEMPLATE_ID &&
    String(draft.customActivityName || "").trim().length === 0
  ) {
    throw new Error("Name the custom activity before saving.");
  }

  const pain = Number(draft.painScore);
  if (!Number.isFinite(pain) || pain < 0 || pain > 10) {
    throw new Error("Pain score must be between 0 and 10.");
  }

  const duration = Number(draft.durationMinutes);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Duration must be a positive number.");
  }

  const effort = Number(draft.effortScore);
  if (!Number.isFinite(effort) || effort < 1 || effort > 10) {
    throw new Error("Effort score must be between 1 and 10.");
  }

  if (draft.feedbackJoint !== "none") {
    const score = Number(draft.feedbackScore);
    if (!Number.isFinite(score) || score < 0 || score > 10) {
      throw new Error("Joint discomfort must be between 0 and 10.");
    }
  }
}

function buildEntryId(nowIso = new Date().toISOString()) {
  return `entry-${Date.parse(nowIso).toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

export function createLogEntryFromDraft({
  draft,
  recommendation = null,
  recommendationSnapshots = [],
  templates = [],
  nowIso = new Date().toISOString()
} = {}) {
  validateRequiredDraft(draft);

  const baseEntry = {
    id: buildEntryId(nowIso),
    templateId: draft.templateId,
    performedAtIso: nowIso,
    painScore: Number(draft.painScore),
    durationMinutes: Number(draft.durationMinutes),
    effortScore: Number(draft.effortScore),
    variant: String(draft.variant || "base"),
    completionStatus: String(draft.completionStatus || "completed"),
    sessionNote: trimOptionalString(draft.sessionNote),
    jointFeedback:
      draft.feedbackJoint && draft.feedbackJoint !== "none"
        ? { [draft.feedbackJoint]: Number(draft.feedbackScore) }
        : undefined,
    customActivity:
      draft.templateId === CUSTOM_ACTIVITY_TEMPLATE_ID
        ? {
            name: String(draft.customActivityName || "").trim(),
            bodyRegion: draft.customBodyRegion || "full_body",
            primaryJoint:
              draft.customPrimaryJoint && draft.customPrimaryJoint !== "none"
                ? draft.customPrimaryJoint
                : null
          }
        : undefined
  };
  const linkedRecommendation = resolveDraftRecommendation({
    draft,
    recommendation,
    recommendationSnapshots,
    nowIso
  });

  if (!linkedRecommendation) {
    return baseEntry;
  }

  return buildRecommendationLinkedEntry({
    entry: baseEntry,
    recommendation: linkedRecommendation,
    templates,
    nowIso
  });
}
