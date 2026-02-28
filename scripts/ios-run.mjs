#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  buildExpoRunArgs,
  DEFAULT_SIMULATOR_NAME,
  parseLaunchPid,
  readBundleIdentifier,
  selectSimulatorDevice
} from "./ios-run-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const appJsonPath = path.join(repoRoot, "mobile", "app.json");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: options.capture ? "utf8" : undefined
  });
}

function getSimctlListJson() {
  const output = run("xcrun", ["simctl", "list", "devices", "available", "--json"], {
    capture: true
  });
  return JSON.parse(output);
}

function ensureSimulatorOpenAndBooted(udid) {
  try {
    run("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", udid]);
  } catch {
    // Continue even if GUI open fails in headless contexts.
  }

  const isAlreadyBooted = (() => {
    try {
      run("xcrun", ["simctl", "bootstatus", udid, "-b"], { capture: true });
      return true;
    } catch {
      return false;
    }
  })();

  if (!isAlreadyBooted) {
    run("xcrun", ["simctl", "boot", udid]);
  }
  run("xcrun", ["simctl", "bootstatus", udid, "-b"]);
}

function runExpo(deviceName) {
  run("npm", buildExpoRunArgs(deviceName));
}

function launchAndVerify(udid, bundleId) {
  const output = run("xcrun", ["simctl", "launch", udid, bundleId], { capture: true });
  const pid = parseLaunchPid(output);
  if (!pid) {
    throw new Error(`Failed to parse app launch PID from: ${output.trim()}`);
  }

  return { pid, raw: output.trim() };
}

function main() {
  const preferredName = process.env.IOS_SIMULATOR_NAME || DEFAULT_SIMULATOR_NAME;
  const bundleId = process.env.IOS_BUNDLE_ID || readBundleIdentifier(appJsonPath);

  const simctl = getSimctlListJson();
  const device = selectSimulatorDevice(simctl, preferredName);

  console.log(`Using simulator: ${device.name} (${device.udid})`);
  ensureSimulatorOpenAndBooted(device.udid);

  runExpo(device.name);

  const launch = launchAndVerify(device.udid, bundleId);
  console.log(`Verified app launch: ${bundleId} (pid ${launch.pid})`);
}

try {
  main();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
