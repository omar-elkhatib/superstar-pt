import test from "node:test";
import assert from "node:assert/strict";
import {
  createDefaultToleranceState,
  rebuildToleranceStateFromEntries,
  updateToleranceFromFeedback
} from "../src/loadModel.mjs";

test("tolerance defaults are conservative", () => {
  const state = createDefaultToleranceState();
  assert.equal(state.factors.ankle, 0.85);
  assert.equal(state.factors.wrist, 0.85);
});

test("tolerance increases slowly for low discomfort", () => {
  const next = updateToleranceFromFeedback({
    toleranceState: createDefaultToleranceState(),
    entries: [
      {
        performedAtIso: "2026-02-27T10:00:00.000Z",
        jointFeedback: { knee: 1, hip: 2 }
      }
    ],
    asOfIso: "2026-02-28T12:00:00.000Z"
  });

  assert.equal(next.factors.knee, 0.88);
  assert.equal(next.factors.hip, 0.88);
});

test("tolerance drops for high discomfort and clamps min bound", () => {
  const baseline = createDefaultToleranceState();
  baseline.factors.ankle = 0.61;

  const next = updateToleranceFromFeedback({
    toleranceState: baseline,
    entries: [
      {
        performedAtIso: "2026-02-27T10:00:00.000Z",
        jointFeedback: { ankle: 8 }
      }
    ],
    asOfIso: "2026-02-28T12:00:00.000Z"
  });

  assert.equal(next.factors.ankle, 0.6);
});


test("tolerance updates are limited to once per 7 days", () => {
  const baseline = createDefaultToleranceState();
  baseline.lastUpdatedIso.knee = "2026-02-25T10:00:00.000Z";

  const next = updateToleranceFromFeedback({
    toleranceState: baseline,
    entries: [
      {
        performedAtIso: "2026-02-27T10:00:00.000Z",
        jointFeedback: { knee: 1 }
      }
    ],
    asOfIso: "2026-02-28T12:00:00.000Z"
  });

  assert.equal(next.factors.knee, 0.85);
});

test("rebuildToleranceStateFromEntries replays weekly feedback in chronological order", () => {
  const rebuilt = rebuildToleranceStateFromEntries({
    entries: [
      {
        performedAtIso: "2026-02-01T10:00:00.000Z",
        jointFeedback: { knee: 1 }
      },
      {
        performedAtIso: "2026-02-10T10:00:00.000Z",
        jointFeedback: { knee: 8 }
      }
    ]
  });

  assert.equal(rebuilt.factors.knee, 0.8);
  assert.equal(rebuilt.lastUpdatedIso.knee, "2026-02-10T10:00:00.000Z");
});
