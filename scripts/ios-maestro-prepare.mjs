#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  buildReleaseAppPath,
  buildReleaseBuildArgs,
  DEFAULT_SIMULATOR_NAME,
  isSimctlBootAlreadySatisfiedError,
  parseLaunchPid,
  readBundleIdentifier,
  selectSimulatorDevice
} from "./ios-run-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const appJsonPath = path.join(repoRoot, "mobile", "app.json");
const iosDir = path.join(repoRoot, "mobile", "ios");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd || repoRoot,
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

function combinedOutput(error) {
  return `${error?.stdout || ""}\n${error?.stderr || ""}\n${error?.message || ""}`;
}

function ensureSimulatorOpenAndBooted(udid) {
  try {
    run("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", udid]);
  } catch {
    // Continue when running in headless CI.
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
    try {
      run("xcrun", ["simctl", "boot", udid], { capture: true });
    } catch (error) {
      if (!isSimctlBootAlreadySatisfiedError(combinedOutput(error))) {
        throw error;
      }
    }
  }

  run("xcrun", ["simctl", "bootstatus", udid, "-b"]);
}

function installPods() {
  run("pod", ["install"], { cwd: iosDir });
}

function buildRelease(deviceName) {
  run("xcodebuild", buildReleaseBuildArgs(deviceName), { cwd: iosDir });
}

function installApp(udid, appPath) {
  run("xcrun", ["simctl", "install", udid, appPath]);
}

function launchAndVerify(udid, bundleId) {
  const output = run("xcrun", ["simctl", "launch", udid, bundleId], { capture: true });
  const pid = parseLaunchPid(output);
  if (!pid) {
    throw new Error(`Failed to parse app launch PID from: ${output.trim()}`);
  }
  return { pid };
}

function main() {
  const preferredName = process.env.IOS_SIMULATOR_NAME || DEFAULT_SIMULATOR_NAME;
  const bundleId = process.env.IOS_BUNDLE_ID || readBundleIdentifier(appJsonPath);

  const simctl = getSimctlListJson();
  const device = selectSimulatorDevice(simctl, preferredName);
  const releaseAppPath = buildReleaseAppPath(repoRoot);

  console.log(`Using simulator: ${device.name} (${device.udid})`);
  ensureSimulatorOpenAndBooted(device.udid);

  console.log("Installing pods...");
  installPods();

  console.log("Building iOS Release app...");
  buildRelease(device.name);

  console.log(`Installing app: ${releaseAppPath}`);
  installApp(device.udid, releaseAppPath);

  const launch = launchAndVerify(device.udid, bundleId);
  console.log(`Verified app launch: ${bundleId} (pid ${launch.pid})`);
}

try {
  main();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
