import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendationLogDraft,
  buildRecommendationLinkedEntry,
  resolveEntryRecommendation,
  updateRecommendationSnapshotAdherence
} from "../src/recommendationLogging.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";

test("buildRecommendationLogDraft creates fast defaults for a recovery recommendation", () => {
  const draft = buildRecommendationLogDraft({
    recommendation: {
      id: "recommendation-2026-03-20",
      dayKey: "2026-03-20",
      action: "regress",
      activityType: "Recovery / technique"
    },
    templates: DEFAULT_EXERCISE_TEMPLATES
  });

  assert.equal(draft.templateId, "walking");
  assert.equal(draft.durationMinutes, 15);
  assert.equal(draft.effortScore, 3);
  assert.equal(draft.variant, "base");
  assert.equal(draft.completionStatus, "completed");
});

test("buildRecommendationLinkedEntry marks exact recommended defaults as followed", () => {
  const recommendation = {
    id: "recommendation-2026-03-20",
    dayKey: "2026-03-20",
    action: "hold",
    activityType: "Base training"
  };

  const linkedEntry = buildRecommendationLinkedEntry({
    entry: {
      id: "entry-1",
      templateId: "walking",
      performedAtIso: "2026-03-20T11:00:00.000Z",
      durationMinutes: 20,
      effortScore: 4,
      variant: "base"
    },
    recommendation,
    templates: DEFAULT_EXERCISE_TEMPLATES,
    nowIso: "2026-03-20T11:00:00.000Z"
  });

  assert.equal(linkedEntry.recommendationLink.recommendationId, recommendation.id);
  assert.equal(linkedEntry.recommendationLink.dayKey, recommendation.dayKey);
  assert.equal(linkedEntry.recommendationLink.adherenceStatus, "followed");
});

test("buildRecommendationLinkedEntry marks changed logging values as modified", () => {
  const recommendation = {
    id: "recommendation-2026-03-20",
    dayKey: "2026-03-20",
    action: "hold",
    activityType: "Base training"
  };

  const linkedEntry = buildRecommendationLinkedEntry({
    entry: {
      id: "entry-2",
      templateId: "cycling",
      performedAtIso: "2026-03-20T11:00:00.000Z",
      durationMinutes: 35,
      effortScore: 5,
      variant: "seated"
    },
    recommendation,
    templates: DEFAULT_EXERCISE_TEMPLATES,
    nowIso: "2026-03-20T11:00:00.000Z"
  });

  assert.equal(linkedEntry.recommendationLink.adherenceStatus, "modified");
});

test("resolveEntryRecommendation supports late linkage to today's recommendation", () => {
  const recommendation = resolveEntryRecommendation({
    explicitRecommendationId: null,
    nowIso: "2026-03-20T15:00:00.000Z",
    recommendationSnapshots: [
      {
        id: "recommendation-2026-03-19",
        dayKey: "2026-03-19"
      },
      {
        id: "recommendation-2026-03-20",
        dayKey: "2026-03-20"
      }
    ]
  });

  assert.equal(recommendation?.id, "recommendation-2026-03-20");
});

test("updateRecommendationSnapshotAdherence records linked entries without duplicates", () => {
  const snapshot = updateRecommendationSnapshotAdherence({
    snapshot: {
      id: "recommendation-2026-03-20",
      dayKey: "2026-03-20",
      adherenceStatus: "pending",
      linkedEntryIds: ["entry-1"]
    },
    adherenceStatus: "modified",
    entryId: "entry-1",
    nowIso: "2026-03-20T16:00:00.000Z"
  });

  assert.equal(snapshot.adherenceStatus, "modified");
  assert.equal(snapshot.lastLinkedEntryId, "entry-1");
  assert.deepEqual(snapshot.linkedEntryIds, ["entry-1"]);
});
