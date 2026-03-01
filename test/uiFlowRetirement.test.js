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

function readMobilePackageScripts() {
  const packageJsonPath = path.join(repoRoot, "mobile", "package.json");
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

test("ios:run targets are removed in favor of mobile:start workflow", () => {
  const rootScripts = readPackageScripts();
  const mobileScripts = readMobilePackageScripts();

  assert.equal(rootScripts["ios:run"], undefined);
  assert.equal(rootScripts["ios:run:expo"], undefined);
  assert.ok(rootScripts["mobile:start"], "expected mobile:start to remain available");

  assert.equal(mobileScripts["ios:run"], undefined);
  assert.equal(mobileScripts["ios:run:expo"], undefined);
  assert.ok(mobileScripts.start, "expected mobile start script to remain available");
});
