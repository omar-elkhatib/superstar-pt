import test from "node:test";
import assert from "node:assert/strict";
import {
  computeEntryJointLoad,
  summarizeRollingLoad,
  JOINT_IDS,
  createDefaultToleranceState
} from "../src/loadModel.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";

function templateById(id) {
  return DEFAULT_EXERCISE_TEMPLATES.find((item) => item.id === id);
}

test("computeEntryJointLoad applies direct and indirect joint weights", () => {
  const entry = {
    templateId: "walking",
    durationMinutes: 30,
    effortScore: 4,
    variant: "base"
  };
  const result = computeEntryJointLoad(entry, templateById("walking"));

  assert.equal(result.sessionLoad, 120);
  assert.ok(result.byJoint.ankle > result.byJoint.spine);
  assert.ok(result.byJoint.knee > 0);
});

test("seated hip abduction keeps ankle load near zero", () => {
  const entry = {
    templateId: "seated_hip_abduction",
    durationMinutes: 20,
    effortScore: 5,
    variant: "seated"
  };
  const result = computeEntryJointLoad(entry, templateById("seated_hip_abduction"));

  assert.equal(result.sessionLoad, 100);
  assert.equal(result.byJoint.ankle, 0);
  assert.ok(result.byJoint.hip > 0);
});

test("variant profile overrides base profile", () => {
  const baseResult = computeEntryJointLoad(
    {
      templateId: "seated_hip_abduction",
      durationMinutes: 20,
      effortScore: 5,
      variant: "base"
    },
    templateById("seated_hip_abduction")
  );
  const seatedResult = computeEntryJointLoad(
    {
      templateId: "seated_hip_abduction",
      durationMinutes: 20,
      effortScore: 5,
      variant: "seated"
    },
    templateById("seated_hip_abduction")
  );

  assert.ok(baseResult.byJoint.ankle > seatedResult.byJoint.ankle);
});

test("summarizeRollingLoad reports joint risk tiers", () => {
  const asOfIso = "2026-02-28T12:00:00.000Z";
  const entries = [
    {
      id: "e1",
      templateId: "walking",
      durationMinutes: 60,
      effortScore: 7,
      variant: "base",
      performedAtIso: "2026-02-28T09:00:00.000Z"
    },
    {
      id: "e2",
      templateId: "walking",
      durationMinutes: 55,
      effortScore: 7,
      variant: "base",
      performedAtIso: "2026-02-27T09:00:00.000Z"
    },
    {
      id: "e3",
      templateId: "walking",
      durationMinutes: 10,
      effortScore: 2,
      variant: "base",
      performedAtIso: "2026-02-18T09:00:00.000Z"
    }
  ];

  const summary = summarizeRollingLoad({
    entries,
    templates: DEFAULT_EXERCISE_TEMPLATES,
    toleranceState: createDefaultToleranceState(),
    asOfIso
  });

  assert.ok(JOINT_IDS.includes(summary.topStressedJoints[0].jointId));
  assert.equal(summary.byJoint.ankle.risk, "high");
  assert.equal(summary.overallRisk, "high");
});
