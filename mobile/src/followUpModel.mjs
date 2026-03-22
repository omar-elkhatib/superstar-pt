export const FOLLOW_UP_FUNCTIONAL_IMPACT_OPTIONS = [
  "improved",
  "unchanged",
  "limited",
  "flare"
];

export const FOLLOW_UP_APPROPRIATENESS_OPTIONS = [
  "appropriate",
  "too_much",
  "too_easy",
  "unsure"
];

function resolveTemplateName(templateById, entry) {
  return templateById.get(entry?.templateId)?.name || entry?.templateId || "Session";
}

function buildEntrySummary(entry) {
  const durationText = Number.isFinite(Number(entry?.durationMinutes))
    ? `${entry.durationMinutes} min`
    : "Unknown duration";
  const effortText = Number.isFinite(Number(entry?.effortScore))
    ? `effort ${entry.effortScore}/10`
    : "effort N/A";

  return `${durationText} · ${effortText}`;
}

export function selectFollowUpPrompt({ tasks = [], entries = [], templates = [], nowIso }) {
  const nowTimestamp = Date.parse(nowIso);
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const pendingTask = [...tasks]
    .filter((task) => task?.status === "pending")
    .sort((a, b) => {
      return Date.parse(a.scheduledForIso) - Date.parse(b.scheduledForIso);
    })[0];

  if (!pendingTask) {
    return {
      status: "empty",
      task: null,
      entry: null,
      isOverdue: false,
      title: "No delayed follow-ups waiting",
      summary: "Your next check-in will appear here after you log a session.",
      ctaLabel: null
    };
  }

  const entry = entryById.get(pendingTask.entryId) || null;
  const templateName = resolveTemplateName(templateById, entry);
  const scheduledTimestamp = Date.parse(pendingTask.scheduledForIso);

  return {
    status: "pending",
    task: pendingTask,
    entry,
    isOverdue: Number.isFinite(nowTimestamp) && Number.isFinite(scheduledTimestamp)
      ? scheduledTimestamp <= nowTimestamp
      : false,
    title: `How did ${templateName} feel later?`,
    summary: buildEntrySummary(entry),
    ctaLabel: "Complete follow-up"
  };
}

export function selectLatestCompletedFollowUp({ tasks = [], entries = [], templates = [] }) {
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));
  const completedTask = [...tasks]
    .filter((task) => task?.status === "completed")
    .sort((a, b) => Date.parse(b.completedAtIso) - Date.parse(a.completedAtIso))[0];

  if (!completedTask) {
    return null;
  }

  const entry = entryById.get(completedTask.entryId) || null;
  const templateName = resolveTemplateName(templateById, entry);

  return {
    task: completedTask,
    entry,
    title: `${templateName} follow-up saved`,
    summary: buildEntrySummary(entry)
  };
}

export function buildFollowUpCompletionPayload({
  painResponse,
  fatigueResponse,
  functionalImpact,
  appropriateness,
  note
}) {
  const parsedPain =
    painResponse === "" || painResponse === null || painResponse === undefined
      ? Number.NaN
      : Number(painResponse);
  if (!Number.isFinite(parsedPain) || parsedPain < 0 || parsedPain > 10) {
    throw new Error("Pain response must be between 0 and 10.");
  }

  const parsedFatigue =
    fatigueResponse === "" || fatigueResponse === null || fatigueResponse === undefined
      ? Number.NaN
      : Number(fatigueResponse);
  if (!Number.isFinite(parsedFatigue) || parsedFatigue < 0 || parsedFatigue > 10) {
    throw new Error("Fatigue response must be between 0 and 10.");
  }

  if (!FOLLOW_UP_FUNCTIONAL_IMPACT_OPTIONS.includes(functionalImpact)) {
    throw new Error("Select how the session affected your function.");
  }

  if (!FOLLOW_UP_APPROPRIATENESS_OPTIONS.includes(appropriateness)) {
    throw new Error("Select whether the session felt appropriate overall.");
  }

  return {
    painResponse: parsedPain,
    fatigueResponse: parsedFatigue,
    functionalImpact,
    appropriateness,
    note: typeof note === "string" ? note.trim() : ""
  };
}
