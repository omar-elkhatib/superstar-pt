import test from "node:test";
import assert from "node:assert/strict";
import {
  createHistoryStore,
  createMemoryStorage
} from "../src/historyStore.mjs";
import {
  summarizeRollingLoad,
  createDefaultToleranceState
} from "../src/loadModel.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";

test("history store persists entries and tolerance state", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  store.addEntry({
    id: "a",
    templateId: "walking",
    performedAtIso: "2026-02-28T10:00:00.000Z",
    durationMinutes: 30,
    effortScore: 4,
    variant: "base"
  });

  const tolerance = createDefaultToleranceState();
  tolerance.factors.knee = 0.8;
  store.setToleranceState(tolerance);

  const store2 = createHistoryStore(storage);
  assert.equal(store2.getEntries().length, 1);
  assert.equal(store2.getToleranceState().factors.knee, 0.8);
});

test("history store persists deleted entries across reloads", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  store.addEntry({
    id: "older",
    templateId: "walking",
    performedAtIso: "2026-02-27T10:00:00.000Z",
    durationMinutes: 20,
    effortScore: 4,
    variant: "base"
  });
  store.addEntry({
    id: "newer",
    templateId: "cycling",
    performedAtIso: "2026-02-28T10:00:00.000Z",
    durationMinutes: 30,
    effortScore: 5,
    variant: "seated"
  });

  const remaining = store.deleteEntry("newer");
  const store2 = createHistoryStore(storage);

  assert.deepEqual(
    remaining.map((entry) => entry.id),
    ["older"]
  );
  assert.deepEqual(
    store2.getEntries().map((entry) => entry.id),
    ["older"]
  );
});

test("history store supports deleting multiple entries in sequence", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  store.addEntry({
    id: "session-1",
    templateId: "walking",
    performedAtIso: "2026-02-27T10:00:00.000Z",
    durationMinutes: 20,
    effortScore: 4,
    variant: "base"
  });
  store.addEntry({
    id: "session-2",
    templateId: "cycling",
    performedAtIso: "2026-02-28T10:00:00.000Z",
    durationMinutes: 30,
    effortScore: 5,
    variant: "seated"
  });
  store.addEntry({
    id: "session-3",
    templateId: "rowing",
    performedAtIso: "2026-03-01T10:00:00.000Z",
    durationMinutes: 25,
    effortScore: 6,
    variant: "supported"
  });

  store.deleteEntry("session-2");
  store.deleteEntry("session-3");

  const reloadedStore = createHistoryStore(storage);
  assert.deepEqual(
    reloadedStore.getEntries().map((entry) => entry.id),
    ["session-1"]
  );
});

test("rolling summary excludes entries older than 14 days", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  store.addEntry({
    id: "recent",
    templateId: "walking",
    performedAtIso: "2026-02-27T10:00:00.000Z",
    durationMinutes: 30,
    effortScore: 5,
    variant: "base"
  });
  store.addEntry({
    id: "stale",
    templateId: "walking",
    performedAtIso: "2026-02-01T10:00:00.000Z",
    durationMinutes: 60,
    effortScore: 8,
    variant: "base"
  });

  const summary = summarizeRollingLoad({
    entries: store.getEntries(),
    templates: DEFAULT_EXERCISE_TEMPLATES,
    toleranceState: store.getToleranceState(),
    asOfIso: "2026-02-28T12:00:00.000Z",
    windowDays: 14,
    acuteDays: 3
  });

  assert.ok(summary.totalBodyLoad > 0);
  assert.ok(summary.byJoint.ankle.chronicLoad < 1000);
});

test("history store persists completed onboarding baseline across reloads", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  store.setBaselineProfile({
    completed: true,
    skipped: false,
    goals: ["move-with-less-pain", "return-to-running"],
    activityLevel: "moderate",
    sensitiveAreas: ["knee", "ankle"]
  });

  const reloadedStore = createHistoryStore(storage);
  assert.deepEqual(reloadedStore.getBaselineProfile(), {
    completed: true,
    skipped: false,
    goals: ["move-with-less-pain", "return-to-running"],
    activityLevel: "moderate",
    sensitiveAreas: ["knee", "ankle"]
  });
});

test("history store supports skipped onboarding without losing daily check-ins", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  store.saveDailyCheckIn(
    {
      painScore: 3,
      readinessScore: 7,
      fatigueScore: 2,
      note: "Ready to ease in"
    },
    { nowIso: "2026-03-20T08:00:00.000Z" }
  );
  store.setBaselineProfile({
    completed: true,
    skipped: true,
    goals: [],
    activityLevel: "",
    sensitiveAreas: []
  });

  const reloadedStore = createHistoryStore(storage);
  assert.deepEqual(reloadedStore.getBaselineProfile(), {
    completed: true,
    skipped: true,
    goals: [],
    activityLevel: "",
    sensitiveAreas: []
  });
  assert.equal(reloadedStore.getCheckIns().length, 1);
  assert.equal(reloadedStore.getCheckIns()[0].note, "Ready to ease in");
});
