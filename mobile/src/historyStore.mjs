import { DEFAULT_EXERCISE_TEMPLATES } from "./exerciseTemplates.mjs";
import { saveDailyCheckInRecord } from "./checkInModel.mjs";
import { createDefaultToleranceState } from "./loadModel.mjs";

const ENTRIES_KEY = "superstar_pt.exercise_entries.v1";
const CHECK_INS_KEY = "superstar_pt.daily_check_ins.v1";
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

  function saveDailyCheckIn(values, { nowIso = new Date().toISOString() } = {}) {
    const result = saveDailyCheckInRecord({
      checkIns: getCheckIns(),
      values,
      nowIso
    });

    setCheckIns(result.saved);
    return result.record;
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
    saveDailyCheckIn,
    getToleranceState,
    setToleranceState,
    getTemplates,
    setTemplates
  };
}

export const appHistoryStore = createHistoryStore();
