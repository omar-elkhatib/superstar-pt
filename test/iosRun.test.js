import test from "node:test";
import assert from "node:assert/strict";
import {
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
