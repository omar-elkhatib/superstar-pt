import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const testDir = path.dirname(new URL(import.meta.url).pathname);
const fixturePath = path.resolve(testDir, "fixtures/xcresult/UIFeedback-sample.xcresult");
const scriptPath = path.resolve(testDir, "../scripts/export-ui-screenshots.mjs");

function hasXcrun() {
  try {
    execFileSync("xcrun", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

test("real xcresult fixture exports non-empty png screenshots", { skip: !hasXcrun() }, () => {
  assert.ok(fs.existsSync(fixturePath), `fixture missing: ${fixturePath}`);

  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "ui-shot-real-"));
  try {
    execFileSync("node", [scriptPath, fixturePath, outputDir], { stdio: "pipe" });

    const pngFiles = fs
      .readdirSync(outputDir)
      .filter((name) => name.toLowerCase().endsWith(".png"))
      .sort();

    assert.ok(pngFiles.length >= 1, "expected at least one PNG from real xcresult fixture");

    for (const file of pngFiles) {
      const size = fs.statSync(path.join(outputDir, file)).size;
      assert.ok(size > 0, `${file} should not be empty`);
    }
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});
