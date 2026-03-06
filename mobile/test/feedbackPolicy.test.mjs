import test from "node:test";
import assert from "node:assert/strict";
import { resolveFeedbackEvent } from "../src/feedbackPolicy.mjs";

test("view change maps to selection haptic without banner", () => {
  const result = resolveFeedbackEvent({
    type: "view_change",
    from: "checkin",
    to: "load"
  });

  assert.deepEqual(result, {
    hapticKind: "selection",
    banner: null
  });
});

test("session added maps to success haptic with short success banner", () => {
  const result = resolveFeedbackEvent({
    type: "session_added",
    templateId: "walking"
  });

  assert.deepEqual(result, {
    hapticKind: "success",
    banner: {
      kind: "success",
      message: "Session added.",
      ttlMs: 1600
    }
  });
});

test("session validation error maps to error haptic with validation banner", () => {
  const result = resolveFeedbackEvent({
    type: "session_validation_error",
    message: "Duration must be a positive number."
  });

  assert.deepEqual(result, {
    hapticKind: "error",
    banner: {
      kind: "error",
      message: "Duration must be a positive number.",
      ttlMs: 2200
    }
  });
});
