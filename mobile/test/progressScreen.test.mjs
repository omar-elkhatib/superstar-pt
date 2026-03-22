import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PROGRESS_SEGMENT,
  buildProgressScreenState
} from "../src/screens/progress/progressScreenModel.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";
import { createDefaultToleranceState } from "../src/loadModel.mjs";

function createBaseArgs(overrides = {}) {
  return {
    checkIns: [],
    recommendationSnapshots: [],
    entries: [],
    followUpTasks: [],
    templates: DEFAULT_EXERCISE_TEMPLATES,
    toleranceState: createDefaultToleranceState(),
    nowIso: "2026-03-22T12:00:00.000Z",
    selectedSegment: undefined,
    selectedSessionId: null,
    ...overrides
  };
}

test("Progress screen defaults to the timeline segment with the unified feed visible", () => {
  const state = buildProgressScreenState(
    createBaseArgs({
      checkIns: [
        {
          id: "checkin-2026-03-22",
          dayKey: "2026-03-22",
          updatedAtIso: "2026-03-22T07:30:00.000Z",
          painScore: 3,
          readinessScore: 7,
          fatigueScore: 2,
          note: "Ready after sleep."
        }
      ],
      recommendationSnapshots: [
        {
          id: "recommendation-2026-03-22",
          dayKey: "2026-03-22",
          updatedAtIso: "2026-03-22T08:00:00.000Z",
          summaryText: "Hold progression today.",
          sourceText: "Today's recommendation is based on your current check-in plus recent load."
        }
      ],
      entries: [
        {
          id: "entry-1",
          templateId: "walking",
          performedAtIso: "2026-03-21T12:30:00.000Z",
          durationMinutes: 20,
          effortScore: 4,
          variant: "base"
        }
      ]
    })
  );

  assert.equal(DEFAULT_PROGRESS_SEGMENT, "timeline");
  assert.equal(state.activeSegment, "timeline");
  assert.equal(state.timeline.visible, true);
  assert.equal(state.load.visible, false);
  assert.deepEqual(
    state.segments.map((segment) => segment.testID),
    ["progress-segment-timeline", "progress-segment-load"]
  );
  assert.deepEqual(
    state.timeline.items.map((item) => item.type),
    ["recommendation", "check_in", "session"]
  );
});

test("Progress load view excludes recommendation history content and focuses on load context", () => {
  const state = buildProgressScreenState(
    createBaseArgs({
      selectedSegment: "load",
      recommendationSnapshots: [
        {
          id: "recommendation-2026-03-22",
          dayKey: "2026-03-22",
          updatedAtIso: "2026-03-22T08:00:00.000Z",
          summaryText: "Unique recommendation copy that must stay out of the load tab."
        }
      ],
      entries: [
        {
          id: "entry-1",
          templateId: "walking",
          performedAtIso: "2026-03-20T10:00:00.000Z",
          durationMinutes: 30,
          effortScore: 4,
          variant: "base"
        },
        {
          id: "entry-2",
          templateId: "walking",
          performedAtIso: "2026-03-21T10:00:00.000Z",
          durationMinutes: 25,
          effortScore: 5,
          variant: "base"
        }
      ]
    })
  );

  assert.equal(state.activeSegment, "load");
  assert.equal(state.timeline.visible, false);
  assert.equal(state.load.visible, true);
  assert.equal(state.load.status, "ready");
  assert.ok(state.load.chart.days.length > 0);
  assert.ok(state.load.riskLegend.length >= 3);
  assert.ok(!JSON.stringify(state.load).includes("Unique recommendation copy that must stay out of the load tab."));
});

test("Progress session detail opens from a selected timeline session item", () => {
  const args = createBaseArgs({
    entries: [
      {
        id: "entry-1",
        templateId: "walking",
        performedAtIso: "2026-03-21T12:30:00.000Z",
        durationMinutes: 20,
        effortScore: 4,
        variant: "base",
        sessionNote: "Felt steady throughout the walk.",
        recommendationLink: {
          recommendationId: "recommendation-2026-03-21",
          dayKey: "2026-03-21",
          adherenceStatus: "followed",
          linkedAtIso: "2026-03-21T12:30:00.000Z"
        }
      }
    ],
    recommendationSnapshots: [
      {
        id: "recommendation-2026-03-21",
        dayKey: "2026-03-21",
        updatedAtIso: "2026-03-21T08:00:00.000Z",
        summaryText: "Stay steady today."
      }
    ],
    followUpTasks: [
      {
        id: "follow-up-entry-1",
        entryId: "entry-1",
        status: "completed",
        scheduledForIso: "2026-03-22T12:30:00.000Z",
        completedAtIso: "2026-03-22T18:00:00.000Z",
        outcome: {
          painResponse: 2,
          fatigueResponse: 3,
          functionalImpact: "improved",
          appropriateness: "appropriate",
          note: "Symptoms settled by the next day."
        }
      }
    ]
  });

  const initialState = buildProgressScreenState(args);
  const sessionItem = initialState.timeline.items.find((item) => item.type === "session");
  const openedState = buildProgressScreenState({
    ...args,
    selectedSessionId: sessionItem.linkedEntityId
  });

  assert.equal(initialState.sessionDetail.status, "closed");
  assert.equal(sessionItem.linkedEntityId, "entry-1");
  assert.equal(openedState.sessionDetail.status, "open");
  assert.equal(openedState.sessionDetail.entryId, "entry-1");
  assert.equal(openedState.sessionDetail.title, "Walking");
  assert.match(openedState.sessionDetail.recommendationStatusLabel, /followed/i);
  assert.match(openedState.sessionDetail.followUpStatusLabel, /completed/i);
});
