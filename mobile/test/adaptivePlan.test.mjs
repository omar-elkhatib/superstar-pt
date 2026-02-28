import test from "node:test";
import assert from "node:assert/strict";
import { adaptSession } from "../src/adaptivePlan.mjs";

test("mobile logic regresses training for pain flare-up", () => {
  const result = adaptSession({
    currentPain: 8,
    priorPain: 4,
    readiness: "high",
    symptomWorsenedIn24h: true
  });

  assert.equal(result.action, "regress");
  assert.equal(result.intensityMultiplier, 0.6);
});
