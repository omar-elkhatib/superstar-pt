import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  APP_TAB_ROUTES,
  DEFAULT_TAB_ROUTE,
  getTabRoute
} from "../src/navigation/routeContracts.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("navigation contracts freeze the top-level tabs and default to TodayTab", () => {
  assert.equal(DEFAULT_TAB_ROUTE, "TodayTab");
  assert.deepEqual(
    APP_TAB_ROUTES.map((route) => route.name),
    ["TodayTab", "LogTab", "ProgressTab"]
  );
  assert.deepEqual(
    APP_TAB_ROUTES.map((route) => route.stackName),
    ["TodayStack", "LogStack", "ProgressStack"]
  );
  assert.deepEqual(
    APP_TAB_ROUTES.map((route) => route.testID),
    ["shell-tab-today", "shell-tab-log", "shell-tab-progress"]
  );
  assert.equal(getTabRoute("ProgressTab").label, "Progress");
});

test("App bootstrap delegates shell rendering to the navigator and safe-area banner host", () => {
  const appSource = fs.readFileSync(path.join(repoRoot, "App.js"), "utf8");

  assert.match(appSource, /SafeAreaProvider/);
  assert.match(appSource, /AppNavigator/);
  assert.match(appSource, /TopFeedbackBanner/);
  assert.doesNotMatch(appSource, /appShellModel\.mjs/);
  assert.doesNotMatch(appSource, /setActiveView\(/);
});

test("placeholder screens exist for each top-level destination", () => {
  const placeholders = [
    ["src/screens/today/TodayScreen.js", "TodayScreen"],
    ["src/screens/log/LogScreen.js", "LogScreen"],
    ["src/screens/progress/ProgressScreen.js", "ProgressScreen"]
  ];

  for (const [relativePath, exportName] of placeholders) {
    const screenSource = fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

    assert.match(screenSource, new RegExp(`export function ${exportName}\\b`));
  }
});

test("mobile package declares the navigation shell dependencies", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

  assert.ok(pkg.dependencies["@react-navigation/native"]);
  assert.ok(pkg.dependencies["@react-navigation/bottom-tabs"]);
  assert.ok(pkg.dependencies["@react-navigation/native-stack"]);
  assert.ok(pkg.dependencies["react-native-safe-area-context"]);
  assert.ok(pkg.dependencies["react-native-screens"]);
});
