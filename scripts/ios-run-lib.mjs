import fs from "node:fs";
import path from "node:path";

export const DEFAULT_SIMULATOR_NAME = "iPhone 17";

function parseRuntimeVersionKey(key) {
  const match = /iOS-(\d+)-(\d+)/.exec(key || "");
  if (!match) {
    return -1;
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major * 100 + minor;
}

function isIOSRuntime(key) {
  return /SimRuntime\.iOS-/.test(key || "");
}

export function flattenIOSDevices(simctlListJson) {
  const result = [];
  const devicesByRuntime = simctlListJson?.devices || {};

  for (const [runtimeKey, devices] of Object.entries(devicesByRuntime)) {
    if (!isIOSRuntime(runtimeKey) || !Array.isArray(devices)) {
      continue;
    }

    const runtimeScore = parseRuntimeVersionKey(runtimeKey);
    for (const device of devices) {
      result.push({
        ...device,
        runtimeKey,
        runtimeScore
      });
    }
  }

  return result;
}

export function selectSimulatorDevice(simctlListJson, preferredName = DEFAULT_SIMULATOR_NAME) {
  const all = flattenIOSDevices(simctlListJson).filter((device) => device.isAvailable !== false);
  if (all.length === 0) {
    throw new Error("No available iOS simulators found.");
  }

  const exactByName = all
    .filter((device) => device.name === preferredName)
    .sort((a, b) => {
      if (a.state === "Booted" && b.state !== "Booted") {
        return -1;
      }
      if (a.state !== "Booted" && b.state === "Booted") {
        return 1;
      }
      return b.runtimeScore - a.runtimeScore;
    });

  if (exactByName.length > 0) {
    return exactByName[0];
  }

  const booted = all.filter((device) => device.state === "Booted");
  if (booted.length > 0) {
    return booted.sort((a, b) => b.runtimeScore - a.runtimeScore)[0];
  }

  return all.sort((a, b) => b.runtimeScore - a.runtimeScore)[0];
}

export function parseLaunchPid(output) {
  const match = /:\s*(\d+)\s*$/.exec((output || "").trim());
  return match ? Number(match[1]) : null;
}

export function readBundleIdentifier(appJsonPath) {
  const raw = fs.readFileSync(appJsonPath, "utf8");
  const parsed = JSON.parse(raw);
  const bundleId = parsed?.expo?.ios?.bundleIdentifier;
  if (!bundleId) {
    throw new Error(`Missing expo.ios.bundleIdentifier in ${appJsonPath}`);
  }
  return bundleId;
}

export function buildExpoRunArgs(deviceName) {
  return ["--prefix", "mobile", "run", "ios:run:expo", "--", "--device", deviceName, "--no-bundler"];
}

export function buildReleaseBuildArgs(deviceName) {
  return [
    "build",
    "-workspace",
    "SuperstarPT.xcworkspace",
    "-scheme",
    "SuperstarPT",
    "-configuration",
    "Release",
    "-destination",
    `platform=iOS Simulator,name=${deviceName}`,
    "-derivedDataPath",
    "../.derived-data"
  ];
}

export function buildReleaseAppPath(repoRoot) {
  return path.join(
    repoRoot,
    "mobile",
    ".derived-data",
    "Build",
    "Products",
    "Release-iphonesimulator",
    "SuperstarPT.app"
  );
}

export function buildSimctlTerminateArgs(udid, bundleId) {
  return ["simctl", "terminate", udid, bundleId];
}

export function buildSimctlShutdownArgs(udid) {
  return ["simctl", "shutdown", udid];
}

export function isSimctlBootAlreadySatisfiedError(output) {
  const value = output || "";
  return (
    /Unable to boot device in current state:\s*(Booted|Booting)/i.test(value) ||
    /already booted/i.test(value)
  );
}

export function buildKillallSimulatorArgs() {
  return ["Simulator"];
}
