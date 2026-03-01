import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  buildFeatureArtifactPaths,
  buildMaestroFeatureTestArgs,
  inferFeatureName,
  resolveFeatureFlowInput
} from "../scripts/ios-maestro-feature-lib.mjs";

test("resolveFeatureFlowInput prefers argv over env", () => {
  const value = resolveFeatureFlowInput({
    argv: ["node", "script", "mobile/.maestro/features/joint-load-visualization.yaml"],
    env: { MAESTRO_FLOW: "mobile/.maestro/features/other.yaml" }
  });

  assert.equal(value, "mobile/.maestro/features/joint-load-visualization.yaml");
});

test("resolveFeatureFlowInput falls back to env", () => {
  const value = resolveFeatureFlowInput({
    argv: ["node", "script"],
    env: { MAESTRO_FLOW: "mobile/.maestro/features/recovery.yaml" }
  });

  assert.equal(value, "mobile/.maestro/features/recovery.yaml");
});

test("resolveFeatureFlowInput throws when no flow is provided", () => {
  assert.throws(
    () => resolveFeatureFlowInput({ argv: ["node", "script"], env: {} }),
    /Provide a Maestro flow path/i
  );
});

test("inferFeatureName derives slug from flow file name", () => {
  const value = inferFeatureName("/repo/mobile/.maestro/features/joint-load-visualization.yaml");
  assert.equal(value, "joint-load-visualization");
});

test("buildFeatureArtifactPaths scopes output by feature", () => {
  const paths = buildFeatureArtifactPaths({
    repoRoot: "/repo/root",
    featureName: "joint-load-visualization"
  });

  assert.deepEqual(paths, {
    resultsXml: path.join(
      "/repo/root",
      "mobile",
      ".derived-data",
      "maestro",
      "features",
      "joint-load-visualization",
      "results.xml"
    ),
    artifactsDir: path.join(
      "/repo/root",
      "mobile",
      ".derived-data",
      "maestro",
      "features",
      "joint-load-visualization",
      "artifacts"
    ),
    debugDir: path.join(
      "/repo/root",
      "mobile",
      ".derived-data",
      "maestro",
      "features",
      "joint-load-visualization",
      "debug"
    )
  });
});

test("buildMaestroFeatureTestArgs wires flow and feature-specific outputs", () => {
  const args = buildMaestroFeatureTestArgs({
    flowPath: "mobile/.maestro/features/joint-load-visualization.yaml",
    artifactPaths: {
      resultsXml: "results.xml",
      artifactsDir: "artifacts",
      debugDir: "debug"
    }
  });

  assert.deepEqual(args, [
    "-p",
    "ios",
    "test",
    "mobile/.maestro/features/joint-load-visualization.yaml",
    "--format",
    "junit",
    "--output",
    "results.xml",
    "--test-output-dir",
    "artifacts",
    "--debug-output",
    "debug",
    "--flatten-debug-output"
  ]);
});
