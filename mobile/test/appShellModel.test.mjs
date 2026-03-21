import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  APP_SHELL_SCREENS,
  DEFAULT_APP_SCREEN,
  buildScreenVisibilityMap,
  getScreenDefinition
} from "../src/appShellModel.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

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

test("daily check-in save does not send the shell back to a legacy main route", () => {
  const appSource = fs.readFileSync(path.join(repoRoot, "App.js"), "utf8");

  assert.doesNotMatch(appSource, /setActiveView\("main"\)/);
  assert.match(appSource, /setActiveView\(DEFAULT_APP_SCREEN\)|setActiveView\("home"\)/);
});
