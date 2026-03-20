import { DEFAULT_EXERCISE_TEMPLATES } from "./exerciseTemplates.mjs";
import { saveDailyCheckInRecord } from "./checkInModel.mjs";
import { createDefaultToleranceState } from "./loadModel.mjs";

const ENTRIES_KEY = "superstar_pt.exercise_entries.v1";
const CHECK_INS_KEY = "superstar_pt.daily_check_ins.v1";
const RECOMMENDATION_SNAPSHOTS_KEY = "superstar_pt.recommendation_snapshots.v1";
const TOLERANCE_KEY = "superstar_pt.joint_tolerance.v1";
const TEMPLATES_KEY = "superstar_pt.exercise_templates.v1";

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

export function createHistoryStore(storage = createMemoryStorage()) {
  function getEntries() {
    return parseOrFallback(storage.getItem(ENTRIES_KEY), []);
  }

  function setEntries(entries) {
    storage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }

  function addEntry(entry) {
    const entries = getEntries();
    const saved = [...entries, entry].sort(
      (a, b) => Date.parse(b.performedAtIso) - Date.parse(a.performedAtIso)
    );
    setEntries(saved);
    return saved;
  }

  function deleteEntry(entryId) {
    const remaining = getEntries().filter((entry) => entry.id !== entryId);
    setEntries(remaining);
    return remaining;
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
      overrideReason: snapshot?.overrideReason || null
    };

    const remaining = existingSnapshots.filter((item) => item.dayKey !== nextSnapshot.dayKey);
    const saved = [...remaining, nextSnapshot].sort((a, b) => {
      return Date.parse(b.updatedAtIso) - Date.parse(a.updatedAtIso);
    });

    setRecommendationSnapshots(saved);
    return nextSnapshot;
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

  return {
    getEntries,
    setEntries,
    addEntry,
    deleteEntry,
    getCheckIns,
    setCheckIns,
    getRecommendationSnapshots,
    setRecommendationSnapshots,
    saveDailyCheckIn,
    saveRecommendationSnapshot,
    getToleranceState,
    setToleranceState,
    getTemplates,
    setTemplates
  };
}

export const appHistoryStore = createHistoryStore();
