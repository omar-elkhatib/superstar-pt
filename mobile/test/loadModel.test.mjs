import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDailyLoadSeries,
  buildRiskCategoryLegend,
  buildDailyRiskGuideFromSummary,
  buildUnifiedLoadChart,
  computeEntryJointLoad,
  JOINT_IDS,
  createDefaultToleranceState,
  selectTopJointSeries,
  summarizeRollingLoad
} from "../src/loadModel.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";
import { CUSTOM_ACTIVITY_TEMPLATE_ID } from "../src/activityEntryMetadata.mjs";

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

test("buildDailyLoadSeries aggregates daily total and joint load with gap days", () => {
  const asOfIso = "2026-02-28T12:00:00.000Z";
  const entries = [
    {
      id: "e1",
      templateId: "walking",
      durationMinutes: 30,
      effortScore: 4,
      variant: "base",
      performedAtIso: "2026-02-26T12:00:00.000Z"
    },
    {
      id: "e2",
      templateId: "walking",
      durationMinutes: 20,
      effortScore: 5,
      variant: "base",
      performedAtIso: "2026-02-28T12:00:00.000Z"
    }
  ];

  const series = buildDailyLoadSeries({
    entries,
    templates: DEFAULT_EXERCISE_TEMPLATES,
    asOfIso
  });

  assert.equal(series.days.length, 3);
  assert.equal(series.days[0].dayKey, "2026-02-26");
  assert.equal(series.days[1].dayKey, "2026-02-27");
  assert.equal(series.days[2].dayKey, "2026-02-28");

  assert.equal(series.days[0].totalLoad, 120);
  assert.equal(series.days[1].totalLoad, 0);
  assert.equal(series.days[2].totalLoad, 100);

  assert.ok(series.days[0].byJoint.ankle > 0);
  assert.equal(series.days[1].byJoint.ankle, 0);
});

test("buildDailyLoadSeries returns empty days when no valid template-backed entries exist", () => {
  const series = buildDailyLoadSeries({
    entries: [
      {
        id: "e1",
        templateId: "missing-template",
        durationMinutes: 30,
        effortScore: 4,
        variant: "base",
        performedAtIso: "2026-02-26T12:00:00.000Z"
      }
    ],
    templates: DEFAULT_EXERCISE_TEMPLATES,
    asOfIso: "2026-02-28T12:00:00.000Z"
  });

  assert.equal(series.days.length, 0);
});

test("buildDailyLoadSeries includes custom activities through a synthetic fallback template", () => {
  const series = buildDailyLoadSeries({
    entries: [
      {
        id: "custom-1",
        templateId: CUSTOM_ACTIVITY_TEMPLATE_ID,
        customActivity: {
          name: "Elliptical intervals",
          bodyRegion: "cardio",
          primaryJoint: "hip"
        },
        durationMinutes: 25,
        effortScore: 5,
        variant: "base",
        performedAtIso: "2026-02-26T12:00:00.000Z"
      }
    ],
    templates: DEFAULT_EXERCISE_TEMPLATES,
    asOfIso: "2026-02-28T12:00:00.000Z"
  });

  assert.equal(series.days.length, 3);
  assert.equal(series.days[0].totalLoad, 125);
  assert.ok(series.days[0].byJoint.hip > 0);
});

test("buildDailyLoadSeries extends through asOf day after the latest entry", () => {
  const series = buildDailyLoadSeries({
    entries: [
      {
        id: "e1",
        templateId: "walking",
        durationMinutes: 30,
        effortScore: 4,
        variant: "base",
        performedAtIso: "2026-02-26T12:00:00.000Z"
      }
    ],
    templates: DEFAULT_EXERCISE_TEMPLATES,
    asOfIso: "2026-02-28T12:00:00.000Z"
  });

  assert.equal(series.days.length, 3);
  assert.equal(series.days[0].dayKey, "2026-02-26");
  assert.equal(series.days[1].dayKey, "2026-02-27");
  assert.equal(series.days[2].dayKey, "2026-02-28");
  assert.equal(series.days[2].totalLoad, 0);
});

test("selectTopJointSeries returns highest cumulative-load joints", () => {
  const top = selectTopJointSeries({
    days: [
      {
        dayKey: "2026-02-26",
        totalLoad: 100,
        byJoint: { ankle: 20, knee: 45, hip: 10 }
      },
      {
        dayKey: "2026-02-27",
        totalLoad: 80,
        byJoint: { ankle: 50, knee: 5, hip: 25 }
      }
    ],
    jointIds: ["ankle", "knee", "hip"],
    count: 2
  });

  assert.deepEqual(top, ["ankle", "knee"]);
});

test("buildUnifiedLoadChart uses one shared max axis across total and selected joints", () => {
  const chart = buildUnifiedLoadChart({
    days: [
      {
        dayKey: "2026-02-26",
        totalLoad: 160,
        byJoint: { ankle: 60, knee: 40, hip: 20 }
      },
      {
        dayKey: "2026-02-27",
        totalLoad: 100,
        byJoint: { ankle: 20, knee: 80, hip: 10 }
      }
    ],
    jointIds: ["ankle", "knee"]
  });

  assert.equal(chart.maxValue, 160);
  assert.deepEqual(chart.seriesKeys, ["total", "ankle", "knee"]);
});

test("buildUnifiedLoadChart keeps day order and fills missing joint values with zero", () => {
  const chart = buildUnifiedLoadChart({
    days: [
      {
        dayKey: "2026-02-26",
        totalLoad: 120,
        byJoint: { ankle: 30 }
      },
      {
        dayKey: "2026-02-27",
        totalLoad: 0,
        byJoint: {}
      }
    ],
    jointIds: ["ankle", "knee"]
  });

  assert.equal(chart.days.length, 2);
  assert.equal(chart.days[0].values.total, 120);
  assert.equal(chart.days[0].values.knee, 0);
  assert.equal(chart.days[1].values.ankle, 0);
  assert.equal(chart.days[1].values.knee, 0);
});

test("buildDailyRiskGuideFromSummary picks the most conservative visible joint threshold", () => {
  const riskGuide = buildDailyRiskGuideFromSummary({
    loadSummary: {
      byJoint: {
        ankle: { chronicLoad: 280, toleranceFactor: 1 },
        knee: { chronicLoad: 140, toleranceFactor: 0.8 },
        hip: { chronicLoad: 210, toleranceFactor: 1.05 }
      }
    },
    jointIds: ["ankle", "knee", "hip"],
    windowDays: 14
  });

  assert.equal(riskGuide.referenceJointId, "knee");
  assert.equal(riskGuide.moderateDailyThreshold, 9.2);
  assert.equal(riskGuide.highDailyThreshold, 10.8);
});

test("buildDailyRiskGuideFromSummary returns null without eligible chronic-load data", () => {
  const riskGuide = buildDailyRiskGuideFromSummary({
    loadSummary: {
      byJoint: {
        ankle: { chronicLoad: 0, toleranceFactor: 1 },
        knee: { chronicLoad: 0, toleranceFactor: 1 }
      }
    },
    jointIds: ["ankle", "knee"],
    windowDays: 14
  });

  assert.equal(riskGuide, null);
});

test("buildRiskCategoryLegend returns low, medium, high bands from risk guide", () => {
  const legend = buildRiskCategoryLegend({
    riskGuide: {
      moderateDailyThreshold: 9.2,
      highDailyThreshold: 10.8
    }
  });

  assert.deepEqual(legend, [
    { category: "low", label: "Low (< 9.2)", color: "#1e7d55" },
    { category: "medium", label: "Medium (9.2 - 10.8)", color: "#c99335" },
    { category: "high", label: "High (>= 10.8)", color: "#b83737" }
  ]);
});

test("buildRiskCategoryLegend returns defaults when risk guide is unavailable", () => {
  const legend = buildRiskCategoryLegend({ riskGuide: null });

  assert.deepEqual(legend, [
    { category: "low", label: "Low", color: "#1e7d55" },
    { category: "medium", label: "Medium", color: "#c99335" },
    { category: "high", label: "High", color: "#b83737" }
  ]);
});
