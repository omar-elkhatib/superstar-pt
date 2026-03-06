import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteSessionById,
  resolveSelectedSessionId
} from "../src/sessionBrowser.mjs";

const ENTRIES = [
  { id: "session-3", performedAtIso: "2026-03-03T09:00:00.000Z" },
  { id: "session-2", performedAtIso: "2026-03-02T09:00:00.000Z" },
  { id: "session-1", performedAtIso: "2026-03-01T09:00:00.000Z" }
];

test("resolveSelectedSessionId falls back to the newest session when nothing is selected", () => {
  const selectedSessionId = resolveSelectedSessionId({
    entries: ENTRIES,
    selectedSessionId: null
  });

  assert.equal(selectedSessionId, "session-3");
});

test("resolveSelectedSessionId keeps the user's selection when it still exists", () => {
  const selectedSessionId = resolveSelectedSessionId({
    entries: ENTRIES,
    selectedSessionId: "session-2"
  });

  assert.equal(selectedSessionId, "session-2");
});

test("deleteSessionById removes the selected session and falls forward to the next available one", () => {
  const nextState = deleteSessionById({
    entries: ENTRIES,
    selectedSessionId: "session-2",
    entryId: "session-2"
  });

  assert.deepEqual(
    nextState.entries.map((entry) => entry.id),
    ["session-3", "session-1"]
  );
  assert.equal(nextState.selectedSessionId, "session-3");
});

test("deleteSessionById preserves the current selection when deleting a different session", () => {
  const nextState = deleteSessionById({
    entries: ENTRIES,
    selectedSessionId: "session-2",
    entryId: "session-1"
  });

  assert.equal(nextState.selectedSessionId, "session-2");
});

test("deleteSessionById supports deleting multiple selected sessions until empty", () => {
  const afterFirstDelete = deleteSessionById({
    entries: ENTRIES,
    selectedSessionId: "session-3",
    entryId: "session-3"
  });
  const afterSecondDelete = deleteSessionById({
    entries: afterFirstDelete.entries,
    selectedSessionId: afterFirstDelete.selectedSessionId,
    entryId: afterFirstDelete.selectedSessionId
  });
  const afterThirdDelete = deleteSessionById({
    entries: afterSecondDelete.entries,
    selectedSessionId: afterSecondDelete.selectedSessionId,
    entryId: afterSecondDelete.selectedSessionId
  });

  assert.deepEqual(afterFirstDelete.entries.map((entry) => entry.id), ["session-2", "session-1"]);
  assert.equal(afterFirstDelete.selectedSessionId, "session-2");
  assert.deepEqual(afterSecondDelete.entries.map((entry) => entry.id), ["session-1"]);
  assert.equal(afterSecondDelete.selectedSessionId, "session-1");
  assert.deepEqual(afterThirdDelete.entries, []);
  assert.equal(afterThirdDelete.selectedSessionId, null);
});
