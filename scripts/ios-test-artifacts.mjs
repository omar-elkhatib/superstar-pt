#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  findLatestScreenshotsDir,
  findLatestXcresult
} from "./export-ui-screenshots-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const derivedDataDir = path.join(repoRoot, "mobile", ".derived-data");

function safeFindLatestXcresult() {
  try {
    return findLatestXcresult(derivedDataDir);
  } catch {
    return null;
  }
}

function relativeFromRepo(fullPath) {
  return fullPath ? path.relative(repoRoot, fullPath) : null;
}

function getLastModified(fullPath) {
  if (!fullPath || !fs.existsSync(fullPath)) {
    return null;
  }
  return fs.statSync(fullPath).mtime.toISOString();
}

function main() {
  const latestXcresult = safeFindLatestXcresult();
  const latestScreenshotsDir = findLatestScreenshotsDir(derivedDataDir);
  const xcodebuildLog = path.join(repoRoot, "mobile", ".expo", "xcodebuild.log");

  console.log("Latest iOS test artifacts");
  console.log(`- xcresult: ${relativeFromRepo(latestXcresult) || "not found"}`);
  if (latestXcresult) {
    console.log(`  modified: ${getLastModified(latestXcresult)}`);
  }

  console.log(
    `- extracted screenshots: ${relativeFromRepo(latestScreenshotsDir) || "not found"}`
  );
  if (latestScreenshotsDir) {
    console.log(`  modified: ${getLastModified(latestScreenshotsDir)}`);
  }

  console.log(
    `- xcodebuild log: ${fs.existsSync(xcodebuildLog) ? path.relative(repoRoot, xcodebuildLog) : "not found"}`
  );
}

main();
