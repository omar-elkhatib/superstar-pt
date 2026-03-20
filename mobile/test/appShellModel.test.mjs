import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_SHELL_SCREENS,
  DEFAULT_APP_SCREEN,
  buildScreenVisibilityMap,
  getScreenDefinition
} from "../src/appShellModel.mjs";

test("app shell defaults to Home and exposes the planned top-level destinations", () => {
  assert.equal(DEFAULT_APP_SCREEN, "home");
  assert.deepEqual(
    APP_SHELL_SCREENS.map((screen) => screen.id),
    ["home", "log", "history", "insights"]
  );
  assert.equal(getScreenDefinition("insights").label, "Insights");
});

test("screen visibility map keeps every destination mounted while marking only the active screen visible", () => {
  const visibility = buildScreenVisibilityMap("history");

  assert.deepEqual(Object.keys(visibility), ["home", "log", "history", "insights"]);
  assert.equal(visibility.home.isVisible, false);
  assert.equal(visibility.log.isVisible, false);
  assert.equal(visibility.history.isVisible, true);
  assert.equal(visibility.insights.isVisible, false);
});

