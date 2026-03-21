#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  buildFeatureArtifactPaths,
  buildMaestroFeatureTestArgs,
  inferFeatureName,
  resolveFeatureFlowInput
} from "./ios-maestro-feature-lib.mjs";
import { buildMaestroEnv, buildMaestroHomePath } from "./ios-maestro-run-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd || repoRoot,
    stdio: "inherit",
    env: options.env || process.env
  });
}

function runNpmScript(scriptName) {
  run("npm", ["run", scriptName]);
}

function getExitCode(error) {
  if (Number.isInteger(error?.status)) {
    return error.status;
  }
  return 1;
}

function ensureFlowExists(flowPath) {
  if (!fs.existsSync(flowPath)) {
    throw new Error(`Maestro flow not found: ${flowPath}`);
  }
}

function ensureArtifactDirectories(paths) {
  fs.mkdirSync(path.dirname(paths.resultsXml), { recursive: true });
  fs.mkdirSync(paths.artifactsDir, { recursive: true });
  fs.mkdirSync(paths.debugDir, { recursive: true });
}

let exitCode = 0;

try {
  const flowInput = resolveFeatureFlowInput({ argv: process.argv, env: process.env });
  const flowPath = path.isAbsolute(flowInput) ? flowInput : path.join(repoRoot, flowInput);
  ensureFlowExists(flowPath);

  const featureName = inferFeatureName(flowPath);
  const artifactPaths = buildFeatureArtifactPaths({ repoRoot, featureName });
  const maestroHome = buildMaestroHomePath({ repoRoot, env: process.env });
  ensureArtifactDirectories(artifactPaths);
  fs.mkdirSync(maestroHome, { recursive: true });

  const maestroArgs = buildMaestroFeatureTestArgs({ flowPath, artifactPaths });

  console.log(`Running Maestro feature flow: ${featureName}`);
  console.log(`Flow path: ${flowPath}`);

  runNpmScript("ios:maestro:prepare");
  run("maestro", maestroArgs, {
    env: buildMaestroEnv({ repoRoot, env: process.env })
  });
} catch (error) {
  console.error(error.message || String(error));
  exitCode = getExitCode(error);
}

try {
  runNpmScript("ios:maestro:teardown");
} catch (error) {
  if (exitCode === 0) {
    console.error(error.message || String(error));
    exitCode = getExitCode(error);
  }
}

process.exit(exitCode);
