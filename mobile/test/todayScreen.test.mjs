import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("Today screen source consumes the adapter and exposes a single recommendation surface", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src/screens/today/TodayScreen.js"), "utf8");

  assert.match(source, /buildTodayScreenState/);
  assert.match(source, /today-checkin-card/);
  assert.match(source, /today-recommendation-card/);
  assert.match(source, /today-followup-card/);
  assert.equal((source.match(/today-recommendation-card/g) || []).length, 1);
  assert.doesNotMatch(source, /today-screen-placeholder/);
  assert.doesNotMatch(source, /recommendationHistory/i);
  assert.doesNotMatch(source, /joint-load visualization/i);
});

test("Today screen model opens onboarding only while the adapter keeps it actionable", async () => {
  const { resolveOnboardingModalVisible } = await import("../src/screens/today/todayScreenModel.mjs");

  assert.equal(
    resolveOnboardingModalVisible({
      onboarding: {
        status: "prompt",
        visible: true
      }
    }),
    true
  );

  assert.equal(
    resolveOnboardingModalVisible({
      onboarding: {
        status: "prompt",
        visible: true
      },
      dismissed: true
    }),
    false
  );

  assert.equal(
    resolveOnboardingModalVisible({
      onboarding: {
        status: "complete",
        visible: false
      }
    }),
    false
  );
});

test("Today screen model routes the recommended-session CTA into Log with recommendation draft params", async () => {
  const {
    buildRecommendedLogNavigationTarget,
    resolveRecommendationPrimaryAction
  } = await import("../src/screens/today/todayScreenModel.mjs");

  const target = buildRecommendedLogNavigationTarget({
    status: "ready",
    recommendationId: "recommendation-2026-03-22",
    logPrefill: {
      templateId: "jogging",
      durationMinutes: 30,
      effortScore: 6,
      variant: "base",
      completionStatus: "completed"
    }
  });

  assert.deepEqual(target, {
    routeName: "LogTab",
    params: {
      screen: "LogScreen",
      params: {
        entryMode: "recommended",
        recommendationId: "recommendation-2026-03-22",
        recommendedSessionDraft: {
          templateId: "jogging",
          durationMinutes: 30,
          effortScore: 6,
          variant: "base",
          completionStatus: "completed"
        },
        source: "today_screen"
      }
    }
  });

  assert.equal(
    resolveRecommendationPrimaryAction({
      status: "locked",
      ctaLabel: "Start today's check-in"
    }),
    "open_check_in"
  );

  assert.equal(
    resolveRecommendationPrimaryAction({
      status: "ready",
      ctaLabel: "Log recommended session"
    }),
    "open_log"
  );
});
