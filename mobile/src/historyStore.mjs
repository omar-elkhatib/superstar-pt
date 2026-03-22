import { DEFAULT_EXERCISE_TEMPLATES } from "./exerciseTemplates.mjs";
import { saveDailyCheckInRecord } from "./checkInModel.mjs";
import { createDefaultToleranceState } from "./loadModel.mjs";
import {
  buildRecommendationLogDraft,
  updateRecommendationSnapshotAdherence
} from "./recommendationLogging.mjs";

const ENTRIES_KEY = "superstar_pt.exercise_entries.v1";
const CHECK_INS_KEY = "superstar_pt.daily_check_ins.v1";
const RECOMMENDATION_SNAPSHOTS_KEY = "superstar_pt.recommendation_snapshots.v1";
const FOLLOW_UP_TASKS_KEY = "superstar_pt.follow_up_tasks.v1";
const TOLERANCE_KEY = "superstar_pt.joint_tolerance.v1";
const TEMPLATES_KEY = "superstar_pt.exercise_templates.v1";
const BASELINE_PROFILE_KEY = "superstar_pt.baseline_profile.v1";
const DEFAULT_FOLLOW_UP_WINDOW_HOURS = 24;

function addHoursToIso(isoString, hours) {
  return new Date(Date.parse(isoString) + hours * 60 * 60 * 1000).toISOString();
}

function normalizeFollowUpTask(task) {
  return {
    id: typeof task?.id === "string" ? task.id : "",
    entryId: typeof task?.entryId === "string" ? task.entryId : "",
    status: task?.status === "completed" ? "completed" : "pending",
    windowHours: Number(task?.windowHours) || DEFAULT_FOLLOW_UP_WINDOW_HOURS,
    scheduledForIso: typeof task?.scheduledForIso === "string" ? task.scheduledForIso : "",
    createdAtIso: typeof task?.createdAtIso === "string" ? task.createdAtIso : "",
    updatedAtIso: typeof task?.updatedAtIso === "string" ? task.updatedAtIso : "",
    completedAtIso: typeof task?.completedAtIso === "string" ? task.completedAtIso : null,
    outcome:
      task?.outcome && typeof task.outcome === "object"
        ? {
            painResponse: Number(task.outcome.painResponse) || 0,
            fatigueResponse: Number(task.outcome.fatigueResponse) || 0,
            functionalImpact:
              typeof task.outcome.functionalImpact === "string" ? task.outcome.functionalImpact : "",
            appropriateness:
              typeof task.outcome.appropriateness === "string" ? task.outcome.appropriateness : "",
            note: typeof task.outcome.note === "string" ? task.outcome.note : ""
          }
        : null
  };
}

function normalizeEntryFollowUp(entry) {
  const pendingTaskIds = Array.isArray(entry?.followUp?.pendingTaskIds)
    ? entry.followUp.pendingTaskIds.filter((taskId) => typeof taskId === "string" && taskId.length > 0)
    : [];

  return {
    pendingTaskIds,
    lastTaskId: typeof entry?.followUp?.lastTaskId === "string" ? entry.followUp.lastTaskId : null,
    lastStatus: entry?.followUp?.lastStatus === "completed" ? "completed" : "pending",
    lastWindowHours: Number(entry?.followUp?.lastWindowHours) || DEFAULT_FOLLOW_UP_WINDOW_HOURS,
    nextPromptAtIso:
      typeof entry?.followUp?.nextPromptAtIso === "string" ? entry.followUp.nextPromptAtIso : null,
    completedAtIso:
      typeof entry?.followUp?.completedAtIso === "string" ? entry.followUp.completedAtIso : null
  };
}

function normalizeDelayedOutcome(outcome) {
  if (!outcome || typeof outcome !== "object") {
    return null;
  }

  return {
    taskId: typeof outcome.taskId === "string" ? outcome.taskId : "",
    completedAtIso: typeof outcome.completedAtIso === "string" ? outcome.completedAtIso : "",
    painResponse: Number(outcome.painResponse) || 0,
    fatigueResponse: Number(outcome.fatigueResponse) || 0,
    functionalImpact: typeof outcome.functionalImpact === "string" ? outcome.functionalImpact : "",
    appropriateness: typeof outcome.appropriateness === "string" ? outcome.appropriateness : "",
    note: typeof outcome.note === "string" ? outcome.note : ""
  };
}

function withEntryFollowUp(entry, followUpPatch) {
  return {
    ...entry,
    followUp: {
      ...normalizeEntryFollowUp(entry),
      ...followUpPatch
    }
  };
}

export function createDefaultBaselineProfile() {
  return {
    completed: false,
    skipped: false,
    goals: [],
    activityLevel: "",
    sensitiveAreas: []
  };
}

export function createMemoryStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    }
  };
}

function parseOrFallback(serialized, fallback) {
  if (!serialized) {
    return fallback;
  }

  try {
    return JSON.parse(serialized);
  } catch {
    return fallback;
  }
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim());
}

function normalizeBaselineProfile(profile) {
  const fallback = createDefaultBaselineProfile();
  const value = profile && typeof profile === "object" ? profile : fallback;

  return {
    completed: Boolean(value.completed),
    skipped: Boolean(value.skipped),
    goals: normalizeStringArray(value.goals),
    activityLevel: typeof value.activityLevel === "string" ? value.activityLevel.trim() : "",
    sensitiveAreas: normalizeStringArray(value.sensitiveAreas)
  };
}

export function createHistoryStore(storage = createMemoryStorage()) {
  function getEntries() {
    return parseOrFallback(storage.getItem(ENTRIES_KEY), []);
  }

  function setEntries(entries) {
    storage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }

  function addEntry(entry) {
    return saveEntry(entry).entries;
  }

  function deleteEntry(entryId) {
    const remaining = getEntries().filter((entry) => entry.id !== entryId);
    const remainingFollowUpTasks = getFollowUpTasks().filter((task) => task.entryId !== entryId);
    setEntries(remaining);
    setFollowUpTasks(remainingFollowUpTasks);
    return remaining;
  }

  function getFollowUpTasks() {
    return parseOrFallback(storage.getItem(FOLLOW_UP_TASKS_KEY), []).map(normalizeFollowUpTask);
  }

  function setFollowUpTasks(tasks) {
    storage.setItem(FOLLOW_UP_TASKS_KEY, JSON.stringify(tasks.map(normalizeFollowUpTask)));
  }

  function getCheckIns() {
    return parseOrFallback(storage.getItem(CHECK_INS_KEY), []);
  }

  function setCheckIns(checkIns) {
    storage.setItem(CHECK_INS_KEY, JSON.stringify(checkIns));
  }

  function getRecommendationSnapshots() {
    return parseOrFallback(storage.getItem(RECOMMENDATION_SNAPSHOTS_KEY), []);
  }

  function setRecommendationSnapshots(snapshots) {
    storage.setItem(RECOMMENDATION_SNAPSHOTS_KEY, JSON.stringify(snapshots));
  }

  function saveDailyCheckIn(values, { nowIso = new Date().toISOString() } = {}) {
    const result = saveDailyCheckInRecord({
      checkIns: getCheckIns(),
      values,
      nowIso
    });

    setCheckIns(result.saved);
    return result.record;
  }

  function saveRecommendationSnapshot(snapshot, { nowIso = new Date().toISOString() } = {}) {
    const existingSnapshots = getRecommendationSnapshots();
    const existing =
      existingSnapshots.find((item) => item.dayKey === snapshot?.dayKey) || null;
    const recommendationDraft = buildRecommendationLogDraft({
      recommendation: snapshot,
      templates: getTemplates()
    });
    const nextSnapshot = {
      id: existing?.id || snapshot?.id || `recommendation-${snapshot?.dayKey || "unknown"}`,
      dayKey: snapshot?.dayKey || "",
      createdAtIso: existing?.createdAtIso || nowIso,
      updatedAtIso: nowIso,
      action: snapshot?.action || "hold",
      activityType: snapshot?.activityType || "Base training",
      intensityMultiplier: Number(snapshot?.intensityMultiplier) || 0,
      volumeGuidance: snapshot?.volumeGuidance || "",
      summaryText: snapshot?.summaryText || "",
      sourceText: snapshot?.sourceText || "",
      overallRisk: snapshot?.overallRisk || "unknown",
      topJoint: snapshot?.topJoint || null,
      recentSessionCount: Number(snapshot?.recentSessionCount || 0),
      isLowHistoryFallback: Boolean(snapshot?.isLowHistoryFallback),
      overrideApplied: Boolean(snapshot?.overrideApplied),
      overrideReason: snapshot?.overrideReason || null,
      recommendedTemplateId:
        snapshot?.recommendedTemplateId || existing?.recommendedTemplateId || recommendationDraft.templateId,
      recommendedDurationMinutes:
        Number(snapshot?.recommendedDurationMinutes) ||
        Number(existing?.recommendedDurationMinutes) ||
        recommendationDraft.durationMinutes,
      recommendedEffortScore:
        Number(snapshot?.recommendedEffortScore) ||
        Number(existing?.recommendedEffortScore) ||
        recommendationDraft.effortScore,
      recommendedVariant:
        snapshot?.recommendedVariant || existing?.recommendedVariant || recommendationDraft.variant,
      adherenceStatus: snapshot?.adherenceStatus || existing?.adherenceStatus || "pending",
      linkedEntryIds: Array.isArray(snapshot?.linkedEntryIds)
        ? snapshot.linkedEntryIds
        : Array.isArray(existing?.linkedEntryIds)
          ? existing.linkedEntryIds
          : [],
      lastLinkedEntryId: snapshot?.lastLinkedEntryId || existing?.lastLinkedEntryId || null,
      skippedAtIso: snapshot?.skippedAtIso || existing?.skippedAtIso || null
    };

    const remaining = existingSnapshots.filter((item) => item.dayKey !== nextSnapshot.dayKey);
    const saved = [...remaining, nextSnapshot].sort((a, b) => {
      return Date.parse(b.updatedAtIso) - Date.parse(a.updatedAtIso);
    });

    setRecommendationSnapshots(saved);
    return nextSnapshot;
  }

  function saveRecommendationAdherence(
    { recommendationId, adherenceStatus, entryId = null },
    { nowIso = new Date().toISOString() } = {}
  ) {
    const snapshots = getRecommendationSnapshots();
    const nextSnapshots = snapshots.map((snapshot) => {
      if (snapshot.id !== recommendationId) {
        return snapshot;
      }

      return updateRecommendationSnapshotAdherence({
        snapshot,
        adherenceStatus,
        entryId,
        nowIso
      });
    });
    const updatedSnapshot =
      nextSnapshots.find((snapshot) => snapshot.id === recommendationId) || null;

    setRecommendationSnapshots(nextSnapshots);
    return updatedSnapshot;
  }

  function getToleranceState() {
    return parseOrFallback(storage.getItem(TOLERANCE_KEY), createDefaultToleranceState());
  }

  function setToleranceState(state) {
    storage.setItem(TOLERANCE_KEY, JSON.stringify(state));
  }

  function getTemplates() {
    const fallback = DEFAULT_EXERCISE_TEMPLATES;
    return parseOrFallback(storage.getItem(TEMPLATES_KEY), fallback);
  }

  function setTemplates(templates) {
    storage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }

  function getBaselineProfile() {
    return normalizeBaselineProfile(
      parseOrFallback(storage.getItem(BASELINE_PROFILE_KEY), createDefaultBaselineProfile())
    );
  }

  function setBaselineProfile(profile) {
    const normalized = normalizeBaselineProfile(profile);
    storage.setItem(BASELINE_PROFILE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function saveEntry(
    entry,
    {
      nowIso = new Date().toISOString(),
      followUpWindowHours = DEFAULT_FOLLOW_UP_WINDOW_HOURS,
      allowDuplicatePendingFollowUp = false
    } = {}
  ) {
    const existingEntries = getEntries();
    const pendingFollowUpTask =
      !allowDuplicatePendingFollowUp &&
      getFollowUpTasks().find((task) => task.entryId === entry?.id && task.status === "pending");
    const nextFollowUpTask =
      pendingFollowUpTask ||
      {
        id: `follow-up-${entry?.id}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
        entryId: entry?.id || "",
        status: "pending",
        windowHours: Number(followUpWindowHours) || DEFAULT_FOLLOW_UP_WINDOW_HOURS,
        scheduledForIso: addHoursToIso(
          entry?.performedAtIso || nowIso,
          Number(followUpWindowHours) || DEFAULT_FOLLOW_UP_WINDOW_HOURS
        ),
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
        completedAtIso: null,
        outcome: null
      };
    const nextEntry = withEntryFollowUp(entry, {
      pendingTaskIds: Array.from(
        new Set([...(entry?.followUp?.pendingTaskIds || []), nextFollowUpTask.id])
      ),
      lastTaskId: nextFollowUpTask.id,
      lastStatus: nextFollowUpTask.status,
      lastWindowHours: nextFollowUpTask.windowHours,
      nextPromptAtIso: nextFollowUpTask.scheduledForIso,
      completedAtIso: null
    });
    const savedEntries = [...existingEntries.filter((item) => item.id !== nextEntry.id), nextEntry].sort(
      (a, b) => Date.parse(b.performedAtIso) - Date.parse(a.performedAtIso)
    );

    setEntries(savedEntries);

    if (!pendingFollowUpTask || allowDuplicatePendingFollowUp) {
      setFollowUpTasks([...getFollowUpTasks(), nextFollowUpTask]);
    }

    return {
      entry: nextEntry,
      entries: savedEntries,
      followUpTask: nextFollowUpTask,
      followUpTasks: getFollowUpTasks()
    };
  }

  function completeFollowUpTask(
    { taskId, outcome },
    { nowIso = new Date().toISOString() } = {}
  ) {
    const tasks = getFollowUpTasks();
    const targetTask = tasks.find((task) => task.id === taskId) || null;

    if (!targetTask) {
      return { task: null, entry: null };
    }

    const completedTask = {
      ...targetTask,
      status: "completed",
      updatedAtIso: nowIso,
      completedAtIso: nowIso,
      outcome: normalizeDelayedOutcome({
        ...outcome,
        taskId,
        completedAtIso: nowIso
      })
    };
    const nextTasks = tasks.map((task) => (task.id === taskId ? completedTask : task));
    const nextEntries = getEntries().map((entry) => {
      if (entry.id !== completedTask.entryId) {
        return entry;
      }

      const currentFollowUp = normalizeEntryFollowUp(entry);
      const pendingTaskIds = currentFollowUp.pendingTaskIds.filter((pendingTaskId) => pendingTaskId !== taskId);
      const nextPromptAtIso =
        nextTasks
          .filter((task) => task.entryId === completedTask.entryId && task.status === "pending")
          .sort((a, b) => Date.parse(a.scheduledForIso) - Date.parse(b.scheduledForIso))[0]
          ?.scheduledForIso || null;

      return {
        ...withEntryFollowUp(entry, {
          pendingTaskIds,
          lastTaskId: taskId,
          lastStatus: "completed",
          lastWindowHours: completedTask.windowHours,
          nextPromptAtIso,
          completedAtIso: nowIso
        }),
        delayedOutcome: normalizeDelayedOutcome({
          ...completedTask.outcome,
          taskId,
          completedAtIso: nowIso
        })
      };
    });

    setFollowUpTasks(nextTasks);
    setEntries(nextEntries);

    return {
      task: completedTask,
      entry: nextEntries.find((entry) => entry.id === completedTask.entryId) || null
    };
  }

  return {
    getEntries,
    setEntries,
    addEntry,
    saveEntry,
    deleteEntry,
    getCheckIns,
    setCheckIns,
    getRecommendationSnapshots,
    setRecommendationSnapshots,
    getFollowUpTasks,
    setFollowUpTasks,
    saveDailyCheckIn,
    saveRecommendationSnapshot,
    saveRecommendationAdherence,
    completeFollowUpTask,
    getToleranceState,
    setToleranceState,
    getTemplates,
    setTemplates,
    getBaselineProfile,
    setBaselineProfile
  };
}

export const appHistoryStore = createHistoryStore();
