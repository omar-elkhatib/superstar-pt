#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function runNpmScript(scriptName) {
  execFileSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    stdio: "inherit"
  });
}

function getExitCode(error) {
  if (Number.isInteger(error?.status)) {
    return error.status;
  }
  return 1;
}

let exitCode = 0;

try {
  runNpmScript("ios:maestro:prepare");
  runNpmScript("ios:maestro:test");
} catch (error) {
  exitCode = getExitCode(error);
}

try {
  runNpmScript("ios:maestro:teardown");
} catch (error) {
  if (exitCode === 0) {
    exitCode = getExitCode(error);
  }
}

process.exit(exitCode);
