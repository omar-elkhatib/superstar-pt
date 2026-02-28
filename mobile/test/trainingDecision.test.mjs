import test from "node:test";
import assert from "node:assert/strict";
import { buildAdaptiveRecommendation } from "../src/loadModel.mjs";

test("high joint risk overrides progress with regress", () => {
  const result = buildAdaptiveRecommendation({
    baseRecommendation: {
      action: "progress",
      intensityMultiplier: 1.05,
      recommendation: "Progress load slightly."
    },
    loadSummary: {
      overallRisk: "high",
      riskByJoint: { ankle: "high" },
      topStressedJoints: [{ jointId: "ankle", risk: "high" }]
    }
  });

  assert.equal(result.action, "regress");
  assert.equal(result.intensityMultiplier, 0.7);
  assert.ok(result.recommendation.includes("ankle"));
});

test("moderate joint risk blocks progression", () => {
  const result = buildAdaptiveRecommendation({
    baseRecommendation: {
      action: "progress",
      intensityMultiplier: 1.05,
      recommendation: "Progress load slightly."
    },
    loadSummary: {
      overallRisk: "moderate",
      riskByJoint: { knee: "moderate" },
      topStressedJoints: [{ jointId: "knee", risk: "moderate" }]
    }
  });

  assert.equal(result.action, "hold");
  assert.equal(result.intensityMultiplier, 0.9);
});

test("low joint risk keeps base recommendation", () => {
  const base = {
    action: "hold",
    intensityMultiplier: 1,
    recommendation: "Keep unchanged."
  };
  const result = buildAdaptiveRecommendation({
    baseRecommendation: base,
    loadSummary: {
      overallRisk: "low",
      riskByJoint: {},
      topStressedJoints: []
    }
  });

  assert.deepEqual(result, {
    ...base,
    overrideApplied: false,
    overrideReason: null
  });
});
