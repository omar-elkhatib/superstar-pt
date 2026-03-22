import test from "node:test";
import assert from "node:assert/strict";
import { buildProgressSummary } from "../src/viewModels/progressSummary.mjs";

test("buildProgressSummary returns the fixed weekly summary copy while preserving load risk semantics", () => {
  const summary = buildProgressSummary({
    entries: [
      {
        id: "session-today",
        performedAtIso: "2026-03-22T09:30:00.000Z"
      },
      {
        id: "session-this-week",
        performedAtIso: "2026-03-18T12:00:00.000Z"
      },
      {
        id: "session-old",
        performedAtIso: "2026-03-14T10:00:00.000Z"
      }
    ],
    followUpTasks: [
      {
        id: "follow-up-complete",
        status: "completed",
        completedAtIso: "2026-03-21T11:00:00.000Z"
      }
    ],
    loadSummary: {
      overallRisk: "moderate",
      topStressedJoints: [
        {
          jointId: "knee"
        }
      ]
    },
    recommendationSnapshots: [
      {
        id: "recommendation-2026-03-22",
        updatedAtIso: "2026-03-22T08:00:00.000Z"
      }
    ],
    nowIso: "2026-03-22T12:00:00.000Z"
  });

  assert.deepEqual(summary, {
    weeklySessionCount: 2,
    riskLabel: "Moderate",
    summaryText: "This week: 2 sessions • Moderate load risk",
    topJointLabel: "Knee"
  });
});

test("buildProgressSummary keeps the header explicit when no sessions or load summary exist", () => {
  const summary = buildProgressSummary({
    entries: [],
    followUpTasks: [
      {
        id: "follow-up-complete",
        status: "completed",
        completedAtIso: "2026-03-21T11:00:00.000Z"
      }
    ],
    loadSummary: null,
    recommendationSnapshots: [],
    nowIso: "2026-03-22T12:00:00.000Z"
  });

  assert.deepEqual(summary, {
    weeklySessionCount: 0,
    riskLabel: "Unknown",
    summaryText: "This week: 0 sessions • Unknown load risk",
    topJointLabel: null
  });
});
