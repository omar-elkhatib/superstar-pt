import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReleaseBuildArgs,
  buildReleaseAppPath,
  buildKillallSimulatorArgs,
  isOsascriptUserCanceledError,
  isSimctlBootAlreadySatisfiedError,
  shouldIgnoreLingeringSimulatorFailure,
  buildSimctlShutdownArgs,
  buildSimctlTerminateArgs,
  buildExpoRunArgs,
  parseLaunchPid,
  readBundleIdentifier,
  selectSimulatorDevice
} from "../scripts/ios-run-lib.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

test("selectSimulatorDevice prefers matching named simulator and newest runtime", () => {
  const simctl = {
    devices: {
      "com.apple.CoreSimulator.SimRuntime.iOS-26-1": [
        { name: "iPhone 17", udid: "A", state: "Shutdown", isAvailable: true }
      ],
      "com.apple.CoreSimulator.SimRuntime.iOS-26-2": [
        { name: "iPhone 17", udid: "B", state: "Booted", isAvailable: true }
      ],
      "com.apple.CoreSimulator.SimRuntime.tvOS-26-0": [
        { name: "Apple TV", udid: "T", state: "Booted", isAvailable: true }
      ]
    }
  };

  const selected = selectSimulatorDevice(simctl, "iPhone 17");
  assert.equal(selected.udid, "B");
});

test("selectSimulatorDevice falls back to booted iOS simulator when preferred is missing", () => {
  const simctl = {
    devices: {
      "com.apple.CoreSimulator.SimRuntime.iOS-25-0": [
        { name: "iPhone 15", udid: "X", state: "Booted", isAvailable: true }
      ],
      "com.apple.CoreSimulator.SimRuntime.iOS-26-2": [
        { name: "iPhone 16", udid: "Y", state: "Shutdown", isAvailable: true }
      ]
    }
  };

  const selected = selectSimulatorDevice(simctl, "iPhone 17");
  assert.equal(selected.udid, "X");
});

test("parseLaunchPid extracts simulator launch PID", () => {
  assert.equal(parseLaunchPid("com.omarelkhatib.superstarpt: 71234"), 71234);
  assert.equal(parseLaunchPid("unexpected output"), null);
});

test("readBundleIdentifier loads bundle ID from app.json", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-id-test-"));
  try {
    const appJsonPath = path.join(root, "app.json");
    fs.writeFileSync(
      appJsonPath,
      JSON.stringify({ expo: { ios: { bundleIdentifier: "com.example.app" } } }),
      "utf8"
    );

    assert.equal(readBundleIdentifier(appJsonPath), "com.example.app");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("buildExpoRunArgs configures no-bundler device run", () => {
  const args = buildExpoRunArgs("iPhone 17");
  assert.deepEqual(args, [
    "--prefix",
    "mobile",
    "run",
    "ios:run:expo",
    "--",
    "--device",
    "iPhone 17",
    "--no-bundler"
  ]);
});

test("buildReleaseBuildArgs configures release simulator build", () => {
  const args = buildReleaseBuildArgs("iPhone 17");
  assert.deepEqual(args, [
    "build",
    "-workspace",
    "SuperstarPT.xcworkspace",
    "-scheme",
    "SuperstarPT",
    "-configuration",
    "Release",
    "-destination",
    "platform=iOS Simulator,name=iPhone 17",
    "-derivedDataPath",
    "../.derived-data"
  ]);
});

test("buildReleaseAppPath points to release simulator app artifact", () => {
  const fullPath = buildReleaseAppPath("/repo/root");
  assert.equal(
    fullPath,
    path.join(
      "/repo/root",
      "mobile",
      ".derived-data",
      "Build",
      "Products",
      "Release-iphonesimulator",
      "SuperstarPT.app"
    )
  );
});

test("buildSimctlTerminateArgs targets specific simulator + bundle", () => {
  const args = buildSimctlTerminateArgs("DEVICE-UDID", "com.example.app");
  assert.deepEqual(args, ["simctl", "terminate", "DEVICE-UDID", "com.example.app"]);
});

test("buildSimctlShutdownArgs targets specific simulator", () => {
  const args = buildSimctlShutdownArgs("DEVICE-UDID");
  assert.deepEqual(args, ["simctl", "shutdown", "DEVICE-UDID"]);
});

test("isSimctlBootAlreadySatisfiedError detects already-booted simulator output", () => {
  const output = `
    An error was encountered processing the command (domain=com.apple.CoreSimulator.SimError, code=405):
    Unable to boot device in current state: Booted
  `;
  assert.equal(isSimctlBootAlreadySatisfiedError(output), true);
});

test("isSimctlBootAlreadySatisfiedError ignores unrelated simctl errors", () => {
  const output = "An error was encountered processing the command: Device not found";
  assert.equal(isSimctlBootAlreadySatisfiedError(output), false);
});

test("isOsascriptUserCanceledError detects headless Simulator quit cancellation", () => {
  const output = "32:36: execution error: Simulator got an error: User canceled. (-128)";
  assert.equal(isOsascriptUserCanceledError(output), true);
});

test("isOsascriptUserCanceledError ignores unrelated osascript failures", () => {
  const output = "execution error: Application isn't running. (-600)";
  assert.equal(isOsascriptUserCanceledError(output), false);
});

test("shouldIgnoreLingeringSimulatorFailure allows CI teardown to continue on osascript cancel", () => {
  const result = shouldIgnoreLingeringSimulatorFailure({
    env: { CI: "true" },
    osascriptOutput: "execution error: Simulator got an error: User canceled. (-128)"
  });
  assert.equal(result, true);
});

test("shouldIgnoreLingeringSimulatorFailure keeps local teardown strict", () => {
  const result = shouldIgnoreLingeringSimulatorFailure({
    env: {},
    osascriptOutput: "execution error: Simulator got an error: User canceled. (-128)"
  });
  assert.equal(result, false);
});

test("buildKillallSimulatorArgs targets Simulator process", () => {
  const args = buildKillallSimulatorArgs();
  assert.deepEqual(args, ["Simulator"]);
});
