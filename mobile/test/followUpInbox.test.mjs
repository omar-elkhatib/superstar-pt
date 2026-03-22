import test from "node:test";
import assert from "node:assert/strict";
import { buildFollowUpInboxState } from "../src/followUpInbox.mjs";

test("follow-up inbox groups overdue items ahead of pending and keeps each item actionable", () => {
  const state = buildFollowUpInboxState({
    nowIso: "2026-03-22T14:00:00.000Z",
    tasks: [
      {
        id: "follow-up-overdue",
        entryId: "entry-overdue",
        status: "pending",
        windowHours: 24,
        scheduledForIso: "2026-03-22T12:00:00.000Z"
      },
      {
        id: "follow-up-pending",
        entryId: "entry-pending",
        status: "pending",
        windowHours: 48,
        scheduledForIso: "2026-03-23T14:00:00.000Z"
      },
      {
        id: "follow-up-completed",
        entryId: "entry-complete",
        status: "completed",
        windowHours: 24,
        scheduledForIso: "2026-03-21T09:00:00.000Z"
      }
    ],
    entries: [
      {
        id: "entry-overdue",
        templateId: "walking",
        performedAtIso: "2026-03-21T12:00:00.000Z"
      },
      {
        id: "entry-pending",
        templateId: "strength",
        performedAtIso: "2026-03-21T14:00:00.000Z"
      }
    ],
    templates: [
      { id: "walking", name: "Walking" },
      { id: "strength", name: "Strength Circuit" }
    ]
  });

  assert.equal(state.totalCount, 2);
  assert.equal(state.overdueCount, 1);
  assert.equal(state.pendingCount, 1);
  assert.equal(state.items.length, 2);
  assert.equal(state.items[0].taskId, "follow-up-overdue");
  assert.equal(state.items[0].status, "overdue");
  assert.equal(state.items[0].title, "Walking");
  assert.equal(state.items[0].timingLabel, "Overdue by 2h");
  assert.equal(state.items[0].scheduledLabel, "Due 2026-03-22 12:00 UTC");
  assert.equal(state.items[0].ctaLabel, "Complete follow-up");
  assert.equal(state.items[0].entryId, "entry-overdue");
  assert.equal(state.items[1].taskId, "follow-up-pending");
  assert.equal(state.items[1].status, "pending");
  assert.equal(state.items[1].title, "Strength Circuit");
  assert.equal(state.items[1].timingLabel, "Due in 1d");
  assert.equal(state.items[1].scheduledLabel, "Due 2026-03-23 14:00 UTC");
});

test("follow-up inbox returns an empty state when no pending tasks remain", () => {
  const state = buildFollowUpInboxState({
    nowIso: "2026-03-22T14:00:00.000Z",
    tasks: [
      {
        id: "follow-up-completed",
        entryId: "entry-complete",
        status: "completed",
        windowHours: 24,
        scheduledForIso: "2026-03-21T09:00:00.000Z"
      }
    ],
    entries: [],
    templates: []
  });

  assert.equal(state.totalCount, 0);
  assert.equal(state.overdueCount, 0);
  assert.equal(state.pendingCount, 0);
  assert.deepEqual(state.items, []);
  assert.equal(state.emptyTitle, "No follow-ups waiting");
  assert.equal(state.emptyBody, "New delayed outcome check-ins will appear here after you log sessions.");
});
