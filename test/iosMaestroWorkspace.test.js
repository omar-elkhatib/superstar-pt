import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function readPackageScripts() {
  const packageJsonPath = path.join(repoRoot, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return packageJson.scripts || {};
}

test("maestro workspace config includes top-level and feature flow discovery", () => {
  const configYaml = readFile("mobile/.maestro/config.yaml");

  assert.match(configYaml, /^flows:/m);
  assert.match(configYaml, /-\s+adaptive-checkin-load-map\.yaml/);
  assert.match(configYaml, /-\s+features\/\*\*\/\*\.yaml/);
});

test("feature flows use shared start fixture for reusable setup", () => {
  const featuresDir = path.join(repoRoot, "mobile", ".maestro", "features");
  const flowFiles = fs
    .readdirSync(featuresDir)
    .filter((fileName) => fileName.endsWith(".yaml"))
    .map((fileName) => path.join(featuresDir, fileName));

  assert.ok(flowFiles.length > 0, "expected at least one feature flow");

  for (const flowPath of flowFiles) {
    const flowContents = fs.readFileSync(flowPath, "utf8");
    assert.match(
      flowContents,
      /runFlow:\s+\.\.\/fixtures\/session-start\.yaml/,
      `${path.basename(flowPath)} must use shared session-start fixture`
    );
  }
});

test("suite e2e script keeps one prepare/test/teardown session for all flows", () => {
  const scripts = readPackageScripts();
  assert.equal(scripts["ios:maestro:test"], "node scripts/ios-maestro-suite-test.mjs");
  assert.equal(scripts["e2e:maestro"], "node scripts/ios-maestro-session.mjs");
});
