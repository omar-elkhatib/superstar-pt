import test from "node:test";
import assert from "node:assert/strict";
import { buildTodayScreenState } from "../src/viewModels/todayScreenState.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";
import {
  createDefaultBaselineProfile
} from "../src/historyStore.mjs";
import { createDefaultToleranceState } from "../src/loadModel.mjs";

function createBaseArgs(overrides = {}) {
  return {
    checkIns: [],
    entries: [],
    followUpTasks: [],
    recommendationSnapshots: [],
    templates: DEFAULT_EXERCISE_TEMPLATES,
    toleranceState: createDefaultToleranceState(),
    baselineProfile: createDefaultBaselineProfile(),
    nowIso: "2026-03-22T09:00:00.000Z",
    ...overrides
  };
}

test("buildTodayScreenState exposes explicit empty Today sections before the first check-in", () => {
  const state = buildTodayScreenState(createBaseArgs());

  assert.equal(state.checkInCard.status, "missing");
  assert.equal(state.checkInCard.title, "Start Your Day");
  assert.equal(state.checkInCard.ctaLabel, "Start today's check-in");

  assert.equal(state.recommendationCard.status, "locked");
  assert.equal(state.recommendationCard.reason, "missing_check_in");
  assert.match(state.recommendationCard.summaryText, /save today's check-in/i);

  assert.equal(state.followUpCard.status, "empty");
  assert.equal(state.weeklySummaryCard.status, "empty");
  assert.equal(state.weeklySummaryCard.summaryText, "This week: 0 sessions • low load risk");

  assert.equal(state.onboarding.status, "prompt");
  assert.equal(state.onboarding.visible, true);
});

test("buildTodayScreenState adapts a completed check-in into a ready recommendation card and weekly teaser", () => {
  const nowIso = "2026-03-22T09:00:00.000Z";
  const state = buildTodayScreenState(
    createBaseArgs({
      checkIns: [
        {
          id: "checkin-2026-03-21",
          dayKey: "2026-03-21",
          createdAtIso: "2026-03-21T08:00:00.000Z",
          updatedAtIso: "2026-03-21T08:00:00.000Z",
          painScore: 2,
          readinessScore: 6,
          fatigueScore: 2,
          note: "Felt fine"
        },
        {
          id: "checkin-2026-03-22",
          dayKey: "2026-03-22",
          createdAtIso: "2026-03-22T07:00:00.000Z",
          updatedAtIso: "2026-03-22T08:30:00.000Z",
          painScore: 2,
          readinessScore: 8,
          fatigueScore: 1,
          note: "Ready to move"
        }
      ],
      entries: [
        {
          id: "entry-1",
          templateId: "walking",
          performedAtIso: "2026-03-10T08:00:00.000Z",
          durationMinutes: 20,
          effortScore: 4,
          variant: "base"
        },
        {
          id: "entry-2",
          templateId: "walking",
          performedAtIso: "2026-03-12T08:00:00.000Z",
          durationMinutes: 20,
          effortScore: 4,
          variant: "base"
        },
        {
          id: "entry-3",
          templateId: "walking",
          performedAtIso: "2026-03-16T08:00:00.000Z",
          durationMinutes: 20,
          effortScore: 4,
          variant: "base"
        },
        {
          id: "entry-4",
          templateId: "walking",
          performedAtIso: "2026-03-18T08:00:00.000Z",
          durationMinutes: 20,
          effortScore: 4,
          variant: "base"
        }
      ],
      recommendationSnapshots: [
        {
          id: "recommendation-2026-03-22",
          dayKey: "2026-03-22",
          adherenceStatus: "followed"
        }
      ],
      baselineProfile: {
        completed: true,
        skipped: false,
        goals: ["move-with-less-pain"],
        activityLevel: "moderate",
        sensitiveAreas: ["knee"]
      },
      nowIso
    })
  );

  assert.equal(state.checkInCard.status, "complete");
  assert.equal(state.checkInCard.summary.note, "Ready to move");

  assert.equal(state.recommendationCard.status, "ready");
  assert.equal(state.recommendationCard.action, "progress");
  assert.equal(state.recommendationCard.activityType, "Progressive training");
  assert.equal(state.recommendationCard.intensityMultiplier, 1.05);
  assert.equal(state.recommendationCard.adherenceStatus, "followed");
  assert.equal(state.recommendationCard.logPrefill.templateId, "jogging");
  assert.equal(state.recommendationCard.logPrefill.durationMinutes, 30);
  assert.equal(state.recommendationCard.logPrefill.effortScore, 6);
  assert.match(state.recommendationCard.summaryText, /progress load slightly/i);

  assert.equal(state.weeklySummaryCard.status, "ready");
  assert.equal(state.weeklySummaryCard.sessionCount, 2);
  assert.equal(state.weeklySummaryCard.summaryText, "This week: 2 sessions • low load risk");

  assert.equal(state.onboarding.visible, false);
  assert.equal(state.onboarding.status, "complete");
});

test("buildTodayScreenState promotes only the highest-priority follow-up onto Today", () => {
  const state = buildTodayScreenState(
    createBaseArgs({
      entries: [
        {
          id: "entry-older",
          templateId: "walking",
          performedAtIso: "2026-03-20T08:00:00.000Z",
          durationMinutes: 25,
          effortScore: 4,
          variant: "base"
        },
        {
          id: "entry-newer",
          templateId: "cycling",
          performedAtIso: "2026-03-21T18:00:00.000Z",
          durationMinutes: 15,
          effortScore: 6,
          variant: "seated"
        }
      ],
      followUpTasks: [
        {
          id: "task-newer",
          entryId: "entry-newer",
          status: "pending",
          windowHours: 24,
          scheduledForIso: "2026-03-22T18:00:00.000Z",
          createdAtIso: "2026-03-21T18:00:00.000Z"
        },
        {
          id: "task-older",
          entryId: "entry-older",
          status: "pending",
          windowHours: 24,
          scheduledForIso: "2026-03-21T08:00:00.000Z",
          createdAtIso: "2026-03-20T08:00:00.000Z"
        }
      ],
      nowIso: "2026-03-22T12:00:00.000Z"
    })
  );

  assert.equal(state.followUpCard.status, "overdue");
  assert.equal(state.followUpCard.taskId, "task-older");
  assert.equal(state.followUpCard.entryId, "entry-older");
  assert.equal(state.followUpCard.remainingCount, 1);
  assert.match(state.followUpCard.title, /walking/i);
  assert.match(state.followUpCard.summaryText, /25 min/i);
  assert.match(state.followUpCard.timingLabel, /overdue/i);
});
