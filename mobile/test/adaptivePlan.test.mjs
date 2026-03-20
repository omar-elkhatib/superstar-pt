import test from "node:test";
import assert from "node:assert/strict";
import { adaptSession, buildDailyPlan } from "../src/adaptivePlan.mjs";

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

test("daily plan falls back to a conservative recommendation when recent history is limited", () => {
  const result = buildDailyPlan({
    checkInInput: {
      currentPain: 1,
      priorPain: 1,
      readiness: "high",
      symptomWorsenedIn24h: false
    },
    loadSummary: {
      overallRisk: "low",
      topStressedJoints: []
    },
    historySummary: {
      recentSessionCount: 0,
      hasRecentHistory: false
    },
    nowIso: "2026-03-20T08:15:00.000Z"
  });

  assert.equal(result.action, "hold");
  assert.equal(result.activityType, "Recovery / technique");
  assert.match(result.sourceText, /isn't enough recent history yet/i);
  assert.equal(result.isLowHistoryFallback, true);
});

test("daily plan combines current check-in and load risk into a persisted-ready recommendation", () => {
  const result = buildDailyPlan({
    checkInInput: {
      currentPain: 4,
      priorPain: 3,
      readiness: "medium",
      symptomWorsenedIn24h: false
    },
    loadSummary: {
      overallRisk: "moderate",
      topStressedJoints: [{ jointId: "knee", risk: "moderate" }]
    },
    historySummary: {
      recentSessionCount: 4,
      hasRecentHistory: true
    },
    nowIso: "2026-03-20T08:15:00.000Z"
  });

  assert.equal(result.dayKey, "2026-03-20");
  assert.equal(result.action, "hold");
  assert.equal(result.activityType, "Base training");
  assert.equal(result.intensityMultiplier, 0.9);
  assert.match(result.summaryText, /moderate joint-load risk on knee/i);
  assert.match(result.volumeGuidance, /hold progression/i);
  assert.equal(result.isLowHistoryFallback, false);
});
