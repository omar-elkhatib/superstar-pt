import test from "node:test";
import assert from "node:assert/strict";
import {
  FOLLOW_UP_APPROPRIATENESS_OPTIONS,
  FOLLOW_UP_FUNCTIONAL_IMPACT_OPTIONS,
  buildFollowUpCompletionPayload,
  selectFollowUpPrompt
} from "../src/followUpModel.mjs";

test("follow-up prompt prioritizes the oldest pending task and shows quick session context", () => {
  const prompt = selectFollowUpPrompt({
    nowIso: "2026-03-22T12:00:00.000Z",
    tasks: [
      {
        id: "task-newer",
        entryId: "entry-newer",
        status: "pending",
        scheduledForIso: "2026-03-22T18:00:00.000Z",
        createdAtIso: "2026-03-21T18:00:00.000Z"
      },
      {
        id: "task-older",
        entryId: "entry-older",
        status: "pending",
        scheduledForIso: "2026-03-21T08:00:00.000Z",
        createdAtIso: "2026-03-20T08:00:00.000Z"
      }
    ],
    entries: [
      {
        id: "entry-older",
        templateId: "walking",
        performedAtIso: "2026-03-20T08:00:00.000Z",
        durationMinutes: 25,
        effortScore: 4
      },
      {
        id: "entry-newer",
        templateId: "rowing",
        performedAtIso: "2026-03-21T18:00:00.000Z",
        durationMinutes: 15,
        effortScore: 6
      }
    ],
    templates: [
      { id: "walking", name: "Walking" },
      { id: "rowing", name: "Rowing" }
    ]
  });

  assert.equal(prompt.status, "pending");
  assert.equal(prompt.task.id, "task-older");
  assert.equal(prompt.entry.id, "entry-older");
  assert.equal(prompt.isOverdue, true);
  assert.equal(prompt.title, "How did Walking feel later?");
  assert.match(prompt.summary, /25 min/);
  assert.match(prompt.summary, /effort 4\/10/);
  assert.equal(prompt.ctaLabel, "Complete follow-up");
});

test("follow-up completion payload trims the note and preserves the delayed outcome fields", () => {
  const payload = buildFollowUpCompletionPayload({
    painResponse: "2",
    fatigueResponse: "5",
    functionalImpact: "improved",
    appropriateness: "appropriate",
    note: "  Symptoms settled by the evening.  "
  });

  assert.deepEqual(FOLLOW_UP_FUNCTIONAL_IMPACT_OPTIONS, [
    "improved",
    "unchanged",
    "limited",
    "flare"
  ]);
  assert.deepEqual(FOLLOW_UP_APPROPRIATENESS_OPTIONS, [
    "appropriate",
    "too_much",
    "too_easy",
    "unsure"
  ]);
  assert.deepEqual(payload, {
    painResponse: 2,
    fatigueResponse: 5,
    functionalImpact: "improved",
    appropriateness: "appropriate",
    note: "Symptoms settled by the evening."
  });
});

test("follow-up completion payload rejects incomplete answers so the user does not save partial outcome data", () => {
  assert.throws(
    () =>
      buildFollowUpCompletionPayload({
        painResponse: "2",
        fatigueResponse: "",
        functionalImpact: "improved",
        appropriateness: "",
        note: ""
      }),
    /Fatigue response must be between 0 and 10\./
  );
});
