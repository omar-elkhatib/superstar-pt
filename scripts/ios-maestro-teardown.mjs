#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import {
  buildKillallSimulatorArgs,
  buildSimctlShutdownArgs,
  buildSimctlTerminateArgs,
  DEFAULT_SIMULATOR_NAME,
  readBundleIdentifier,
  selectSimulatorDevice
} from "./ios-run-lib.mjs";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const appJsonPath = path.join(repoRoot, "mobile", "app.json");

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd || repoRoot,
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: options.capture ? "utf8" : undefined
  });
}

function getSimctlListJson() {
  const output = run("xcrun", ["simctl", "list", "devices", "--json"], { capture: true });
  return JSON.parse(output);
}

function combinedOutput(error) {
  return `${error?.stdout || ""}\n${error?.stderr || ""}`;
}

function terminateApp(udid, bundleId) {
  try {
    run("xcrun", buildSimctlTerminateArgs(udid, bundleId), { capture: true });
    console.log(`Terminated app: ${bundleId}`);
  } catch (error) {
    const output = combinedOutput(error);
    if (
      /found nothing to terminate/i.test(output) ||
      /No such process/i.test(output) ||
      /isn't running/i.test(output)
    ) {
      console.log(`App already stopped: ${bundleId}`);
      return;
    }
    throw error;
  }
}

function shutdownSimulator(udid) {
  try {
    run("xcrun", buildSimctlShutdownArgs(udid));
    console.log(`Shutdown simulator: ${udid}`);
  } catch (error) {
    const output = combinedOutput(error);
    if (/Unable to shutdown device in current state: Shutdown/i.test(output)) {
      console.log(`Simulator already shutdown: ${udid}`);
      return;
    }
    throw error;
  }
}

function quitSimulatorApp() {
  const simulatorStillRunning = () => {
    try {
      run("pgrep", ["-x", "Simulator"], { capture: true });
      return true;
    } catch {
      return false;
    }
  };

  try {
    run("osascript", ["-e", 'tell application "Simulator" to quit']);
  } catch {
    // Ignore failures in headless contexts and fallback to killall.
  }

  if (simulatorStillRunning()) {
    try {
      run("killall", buildKillallSimulatorArgs());
    } catch (error) {
      const output = combinedOutput(error);
      if (!/No matching processes belonging to you/i.test(output)) {
        throw error;
      }
    }
  }

  if (simulatorStillRunning()) {
    throw new Error("Simulator process is still running after teardown.");
  }

  console.log("Closed Simulator app.");
}

function main() {
  const preferredName = process.env.IOS_SIMULATOR_NAME || DEFAULT_SIMULATOR_NAME;
  const bundleId = process.env.IOS_BUNDLE_ID || readBundleIdentifier(appJsonPath);

  const simctl = getSimctlListJson();
  const device = selectSimulatorDevice(simctl, preferredName);
  console.log(`Using simulator for teardown: ${device.name} (${device.udid})`);

  terminateApp(device.udid, bundleId);
  shutdownSimulator(device.udid);
  quitSimulatorApp();
}

try {
  main();
} catch (error) {
  console.error(error.message || String(error));
  process.exit(1);
}
