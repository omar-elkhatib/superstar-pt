#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { extractFromManifest, findLatestXcresult } from "./export-ui-screenshots-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const derivedDataDir = path.join(repoRoot, "mobile", ".derived-data");

function exportAttachments(xcresultPath, exportDir) {
  execFileSync("xcrun", [
    "xcresulttool",
    "export",
    "attachments",
    "--path",
    xcresultPath,
    "--output-path",
    exportDir
  ], { stdio: "inherit" });
}

function ensurePng(srcPath, dstPath) {
  const lower = srcPath.toLowerCase();
  if (lower.endsWith(".png")) {
    fs.copyFileSync(srcPath, dstPath);
    return;
  }

  execFileSync("sips", ["-s", "format", "png", srcPath, "--out", dstPath], { stdio: "inherit" });
}

function main() {
  const xcresultArg = process.argv[2];
  const outputArg = process.argv[3];

  const xcresultPath = path.resolve(xcresultArg || findLatestXcresult(derivedDataDir));
  if (!fs.existsSync(xcresultPath)) {
    throw new Error(`xcresult path does not exist: ${xcresultPath}`);
  }

  const defaultOutputDir = path.join(
    derivedDataDir,
    "ui-screenshots",
    path.basename(xcresultPath, ".xcresult")
  );
  const outputDir = path.resolve(outputArg || defaultOutputDir);

  fs.mkdirSync(outputDir, { recursive: true });

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "xcattachments-"));
  try {
    exportAttachments(xcresultPath, tempRoot);

    const manifestPath = path.join(tempRoot, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`manifest.json not found in export directory: ${tempRoot}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const count = extractFromManifest(manifest, tempRoot, outputDir, ensurePng);

    console.log(`Extracted ${count} screenshot(s) to: ${outputDir}`);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
