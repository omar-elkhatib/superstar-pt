#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const suites = [
  {
    name: "core",
    target: path.join(repoRoot, "mobile", ".maestro", "adaptive-checkin-load-map.yaml")
  },
  {
    name: "features",
    target: path.join(repoRoot, "mobile", ".maestro", "features")
  }
];

function getExitCode(error) {
  if (Number.isInteger(error?.status)) {
    return error.status;
  }
  return 1;
}

function runSuite({ name, target }) {
  if (!fs.existsSync(target)) {
    console.log(`Skipping Maestro suite '${name}': missing path ${target}`);
    return;
  }

  const outputRoot = path.join(repoRoot, "mobile", ".derived-data", "maestro", name);
  const resultsXml = path.join(outputRoot, "results.xml");
  const artifactsDir = path.join(outputRoot, "artifacts");
  const debugDir = path.join(outputRoot, "debug");

  fs.mkdirSync(artifactsDir, { recursive: true });
  fs.mkdirSync(debugDir, { recursive: true });

  const args = [
    "-p",
    "ios",
    "test",
    target,
    "--format",
    "junit",
    "--output",
    resultsXml,
    "--test-output-dir",
    artifactsDir,
    "--debug-output",
    debugDir,
    "--flatten-debug-output"
  ];

  console.log(`Running Maestro suite: ${name}`);
  execFileSync("maestro", args, {
    cwd: repoRoot,
    stdio: "inherit"
  });
}

let exitCode = 0;

for (const suite of suites) {
  try {
    runSuite(suite);
  } catch (error) {
    console.error(`Suite failed: ${suite.name}`);
    if (exitCode === 0) {
      exitCode = getExitCode(error);
    }
  }
}

process.exit(exitCode);
