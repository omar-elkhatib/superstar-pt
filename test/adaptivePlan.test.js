import test from "node:test";
import assert from "node:assert/strict";
import { adaptSession } from "../src/adaptivePlan.js";

test("regresses session on flare-up conditions", () => {
  const result = adaptSession({
    currentPain: 7,
    priorPain: 3,
    readiness: "high",
    symptomWorsenedIn24h: true
  });

  assert.equal(result.action, "regress");
  assert.equal(result.intensityMultiplier, 0.6);
});

test("holds with reduced intensity on low readiness", () => {
  const result = adaptSession({
    currentPain: 2,
    priorPain: 2,
    readiness: "low",
    symptomWorsenedIn24h: false
  });

  assert.equal(result.action, "hold");
  assert.equal(result.intensityMultiplier, 0.8);
});

test("progresses slightly on high readiness without flare-up", () => {
  const result = adaptSession({
    currentPain: 2,
    priorPain: 1,
    readiness: "high",
    symptomWorsenedIn24h: false
  });

  assert.equal(result.action, "progress");
  assert.equal(result.intensityMultiplier, 1.05);
});

