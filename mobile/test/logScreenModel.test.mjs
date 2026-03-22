import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLogScreenState,
  createLogDraft,
  createLogEntryFromDraft
} from "../src/screens/log/logScreenModel.mjs";
import { CUSTOM_ACTIVITY_TEMPLATE_ID } from "../src/activityEntryMetadata.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";

function createRecommendation(overrides = {}) {
  return {
    id: "recommendation-2026-03-22",
    dayKey: "2026-03-22",
    action: "progress",
    activityType: "Progressive training",
    summaryText: "Progress load slightly if form and symptoms stay stable.",
    sourceText: "Today's recommendation is based on your current check-in plus recent load.",
    recommendedTemplateId: "jogging",
    recommendedDurationMinutes: 30,
    recommendedEffortScore: 6,
    recommendedVariant: "base",
    ...overrides
  };
}

test("buildLogScreenState keeps recommended prefill above the fold while optional rows stay secondary", () => {
  const state = buildLogScreenState({
    mode: "recommended",
    recommendation: createRecommendation(),
    templates: DEFAULT_EXERCISE_TEMPLATES
  });

  assert.equal(state.mode, "recommended");
  assert.deepEqual(
    state.modeOptions.map((option) => option.testID),
    ["log-mode-recommended", "log-mode-manual"]
  );
  assert.equal(state.prefillCard.status, "ready");
  assert.equal(state.prefillCard.title, "Today's recommendation");
  assert.match(state.prefillCard.summaryText, /progress load slightly/i);
  assert.match(state.prefillCard.detailText, /30 min/i);
  assert.deepEqual(state.primaryFieldIds, [
    "activity",
    "variant",
    "duration",
    "effort",
    "completion",
    "pain"
  ]);
  assert.deepEqual(state.optionalFieldIds, ["jointFeedback", "notes"]);
  assert.equal(state.saveAction.label, "Save recommended session");
  assert.equal(state.draft.templateId, "jogging");
  assert.equal(state.draft.durationMinutes, "30");
  assert.equal(state.draft.effortScore, "6");
});

test("createLogEntryFromDraft keeps an unchanged recommended session classified as followed", () => {
  const recommendation = createRecommendation({
    action: "hold",
    recommendedTemplateId: "walking",
    recommendedDurationMinutes: 20,
    recommendedEffortScore: 4
  });

  const draft = createLogDraft({
    mode: "recommended",
    recommendation,
    templates: DEFAULT_EXERCISE_TEMPLATES,
    painScore: 3
  });
  const entry = createLogEntryFromDraft({
    draft,
    recommendation,
    templates: DEFAULT_EXERCISE_TEMPLATES,
    nowIso: "2026-03-22T10:00:00.000Z"
  });

  assert.equal(entry.templateId, "walking");
  assert.equal(entry.durationMinutes, 20);
  assert.equal(entry.effortScore, 4);
  assert.equal(entry.recommendationLink?.recommendationId, recommendation.id);
  assert.equal(entry.recommendationLink?.adherenceStatus, "followed");
});

test("createLogEntryFromDraft preserves manual custom activity metadata for save", () => {
  const entry = createLogEntryFromDraft({
    draft: {
      ...createLogDraft({
        mode: "manual",
        templates: DEFAULT_EXERCISE_TEMPLATES,
        painScore: 2
      }),
      templateId: CUSTOM_ACTIVITY_TEMPLATE_ID,
      customActivityName: "Band mobility",
      customBodyRegion: "mobility",
      customPrimaryJoint: "shoulder",
      durationMinutes: "18",
      effortScore: "3",
      completionStatus: "partial",
      sessionNote: "Kept it light after the warm-up."
    },
    templates: DEFAULT_EXERCISE_TEMPLATES,
    nowIso: "2026-03-22T11:15:00.000Z"
  });

  assert.equal(entry.templateId, CUSTOM_ACTIVITY_TEMPLATE_ID);
  assert.equal(entry.customActivity?.name, "Band mobility");
  assert.equal(entry.customActivity?.bodyRegion, "mobility");
  assert.equal(entry.customActivity?.primaryJoint, "shoulder");
  assert.equal(entry.completionStatus, "partial");
  assert.equal(entry.sessionNote, "Kept it light after the warm-up.");
});
