import test from "node:test";
import assert from "node:assert/strict";
import {
  createHistoryStore,
  createMemoryStorage
} from "../src/historyStore.mjs";
import {
  buildDailyRecommendationInput,
  selectDailyHomeState
} from "../src/checkInModel.mjs";

test("same-day check-in save creates a daily record and persists the latest values", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  const firstSave = store.saveDailyCheckIn(
    {
      painScore: 4,
      readinessScore: 6,
      fatigueScore: 3,
      note: "Warm-up stiffness"
    },
    { nowIso: "2026-03-20T08:15:00.000Z" }
  );

  assert.equal(firstSave.id, "checkin-2026-03-20");
  assert.equal(firstSave.dayKey, "2026-03-20");
  assert.equal(firstSave.createdAtIso, "2026-03-20T08:15:00.000Z");
  assert.equal(firstSave.updatedAtIso, "2026-03-20T08:15:00.000Z");

  const secondSave = store.saveDailyCheckIn(
    {
      painScore: 2,
      readinessScore: 8,
      fatigueScore: 2,
      note: "Looser after sleep"
    },
    { nowIso: "2026-03-20T11:45:00.000Z" }
  );

  const reloadedStore = createHistoryStore(storage);
  const persistedCheckIns = reloadedStore.getCheckIns();

  assert.equal(secondSave.id, "checkin-2026-03-20");
  assert.equal(secondSave.createdAtIso, "2026-03-20T08:15:00.000Z");
  assert.equal(secondSave.updatedAtIso, "2026-03-20T11:45:00.000Z");
  assert.equal(persistedCheckIns.length, 1);
  assert.equal(persistedCheckIns[0].painScore, 2);
  assert.equal(persistedCheckIns[0].readinessScore, 8);
  assert.equal(persistedCheckIns[0].fatigueScore, 2);
  assert.equal(persistedCheckIns[0].note, "Looser after sleep");
});

test("same-day edits leave prior-day records untouched and feed today's recommendation input", () => {
  const storage = createMemoryStorage();
  const store = createHistoryStore(storage);

  store.saveDailyCheckIn(
    {
      painScore: 5,
      readinessScore: 4,
      fatigueScore: 6,
      note: "Yesterday baseline"
    },
    { nowIso: "2026-03-19T09:00:00.000Z" }
  );

  store.saveDailyCheckIn(
    {
      painScore: 3,
      readinessScore: 8,
      fatigueScore: 2,
      note: "Ready to move"
    },
    { nowIso: "2026-03-20T07:30:00.000Z" }
  );

  const updatedToday = store.saveDailyCheckIn(
    {
      painScore: 7,
      readinessScore: 2,
      fatigueScore: 8,
      note: "Worsened after commute"
    },
    { nowIso: "2026-03-20T12:05:00.000Z" }
  );

  const checkIns = store.getCheckIns();
  const yesterday = checkIns.find((checkIn) => checkIn.dayKey === "2026-03-19");
  const today = checkIns.find((checkIn) => checkIn.dayKey === "2026-03-20");
  const recommendationInput = buildDailyRecommendationInput({
    checkIns,
    nowIso: "2026-03-20T12:05:00.000Z"
  });

  assert.equal(checkIns.length, 2);
  assert.equal(yesterday.painScore, 5);
  assert.equal(yesterday.note, "Yesterday baseline");
  assert.equal(today.id, updatedToday.id);
  assert.equal(today.painScore, 7);
  assert.equal(today.readinessScore, 2);
  assert.equal(today.fatigueScore, 8);
  assert.equal(recommendationInput.currentPain, 7);
  assert.equal(recommendationInput.priorPain, 5);
  assert.equal(recommendationInput.readiness, "low");
  assert.equal(recommendationInput.symptomWorsenedIn24h, true);
});

test("home state shows a missing-check-in prompt until today's record exists, then switches to summary/edit mode", () => {
  const nowIso = "2026-03-20T10:00:00.000Z";
  const missingState = selectDailyHomeState({
    checkIns: [],
    nowIso
  });

  assert.equal(missingState.status, "missing");
  assert.equal(missingState.ctaLabel, "Start today's check-in");
  assert.equal(missingState.mode, "create");

  const completeState = selectDailyHomeState({
    checkIns: [
      {
        id: "checkin-2026-03-20",
        dayKey: "2026-03-20",
        createdAtIso: "2026-03-20T08:00:00.000Z",
        updatedAtIso: "2026-03-20T10:00:00.000Z",
        painScore: 2,
        readinessScore: 9,
        fatigueScore: 1,
        note: "Ready"
      }
    ],
    nowIso
  });

  assert.equal(completeState.status, "complete");
  assert.equal(completeState.mode, "edit");
  assert.equal(completeState.ctaLabel, "Edit today's check-in");
  assert.equal(completeState.summary.painLabel, "Pain 2/10");
  assert.equal(completeState.summary.readinessLabel, "Readiness 9/10");
  assert.equal(completeState.summary.fatigueLabel, "Fatigue 1/10");
});
