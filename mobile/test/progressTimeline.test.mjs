import test from "node:test";
import assert from "node:assert/strict";
import { buildProgressTimeline } from "../src/viewModels/progressTimeline.mjs";

test("buildProgressTimeline mixes recommendations, check-ins, sessions, and follow-ups newest-first", () => {
  const timeline = buildProgressTimeline({
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
        variant: "base",
        sessionNote: "Felt steady throughout the walk."
      }
    ],
    followUpTasks: [
      {
        id: "follow-up-entry-1",
        entryId: "entry-1",
        status: "completed",
        scheduledForIso: "2026-03-22T12:30:00.000Z",
        completedAtIso: "2026-03-20T18:00:00.000Z",
        outcome: {
          painResponse: 2,
          fatigueResponse: 3,
          functionalImpact: "improved",
          appropriateness: "appropriate",
          note: "Symptoms settled by the next day."
        }
      }
    ],
    templates: [
      {
        id: "walking",
        name: "Walking"
      }
    ],
    nowIso: "2026-03-22T12:00:00.000Z"
  });

  assert.equal(timeline.items.length, 4);
  assert.deepEqual(
    timeline.items.map((item) => item.type),
    ["recommendation", "check_in", "session", "follow_up"]
  );
  assert.deepEqual(timeline.items[0], {
    id: "recommendation:recommendation-2026-03-22",
    type: "recommendation",
    timestampIso: "2026-03-22T08:00:00.000Z",
    title: "Recommendation",
    subtitle: "Hold progression today.",
    detail: "Today's recommendation is based on your current check-in plus recent load.",
    linkedEntityId: "recommendation-2026-03-22"
  });
  assert.deepEqual(timeline.items[1], {
    id: "check_in:checkin-2026-03-22",
    type: "check_in",
    timestampIso: "2026-03-22T07:30:00.000Z",
    title: "Check-in",
    subtitle: "Pain 3 · Ready 7 · Fatigue 2",
    detail: "Ready after sleep.",
    linkedEntityId: "checkin-2026-03-22"
  });
  assert.deepEqual(timeline.items[2], {
    id: "session:entry-1",
    type: "session",
    timestampIso: "2026-03-21T12:30:00.000Z",
    title: "Session",
    subtitle: "Walking · 20m · effort 4/10",
    detail: "Felt steady throughout the walk.",
    linkedEntityId: "entry-1"
  });
  assert.deepEqual(timeline.items[3], {
    id: "follow_up:follow-up-entry-1",
    type: "follow_up",
    timestampIso: "2026-03-20T18:00:00.000Z",
    title: "Follow-up",
    subtitle: "Improved function",
    detail: "Symptoms settled by the next day.",
    linkedEntityId: "follow-up-entry-1"
  });
});

test("buildProgressTimeline returns an explicit empty state when no progress records exist yet", () => {
  const timeline = buildProgressTimeline({
    checkIns: [],
    recommendationSnapshots: [],
    entries: [],
    followUpTasks: [],
    templates: [],
    nowIso: "2026-03-22T12:00:00.000Z"
  });

  assert.deepEqual(timeline.items, []);
  assert.equal(timeline.emptyTitle, "No progress history yet");
  assert.equal(
    timeline.emptyBody,
    "Check-ins, recommendations, sessions, and follow-ups will appear here as you use the app."
  );
});
