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

test("history store persists recommendation snapshots and replaces the same day's recommendation", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  const firstSnapshot = store.saveRecommendationSnapshot(
    {
      dayKey: "2026-03-20",
      action: "hold",
      activityType: "Recovery / technique",
      intensityMultiplier: 0.85,
      volumeGuidance: "Keep the session short while the app learns your baseline.",
      summaryText: "Start with a light session today.",
      sourceText: "Today's recommendation is based on your check-in because there isn't enough recent history yet.",
      isLowHistoryFallback: true
    },
    { nowIso: "2026-03-20T08:15:00.000Z" }
  );

  const secondSnapshot = store.saveRecommendationSnapshot(
    {
      dayKey: "2026-03-20",
      action: "regress",
      activityType: "Recovery / technique",
      intensityMultiplier: 0.6,
      volumeGuidance: "Reduce volume sharply and prioritize symptom-calming work.",
      summaryText: "Switch to low-load recovery work today.",
      sourceText: "Today's recommendation is based on your current check-in plus recent load.",
      isLowHistoryFallback: false
    },
    { nowIso: "2026-03-20T12:05:00.000Z" }
  );

  const reloadedStore = createHistoryStore(storage);
  const snapshots = reloadedStore.getRecommendationSnapshots();

  assert.equal(firstSnapshot.id, "recommendation-2026-03-20");
  assert.equal(secondSnapshot.id, "recommendation-2026-03-20");
  assert.equal(snapshots.length, 1);
  assert.equal(snapshots[0].summaryText, "Switch to low-load recovery work today.");
  assert.equal(snapshots[0].updatedAtIso, "2026-03-20T12:05:00.000Z");
  assert.equal(snapshots[0].isLowHistoryFallback, false);
});
