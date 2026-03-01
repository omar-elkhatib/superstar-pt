import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readPackageScripts() {
  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return packageJson.scripts || {};
}

test("legacy ad-hoc iOS UI testing scripts are removed", () => {
  const scripts = readPackageScripts();

  assert.equal(scripts["ios:test:ui"], undefined);
  assert.equal(scripts["ios:test:ui:extract"], undefined);
  assert.equal(scripts["ios:test:artifacts"], undefined);
  assert.ok(scripts["e2e:maestro"], "expected Maestro E2E script to remain available");
});
