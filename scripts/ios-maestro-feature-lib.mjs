import path from "node:path";

export function resolveFeatureFlowInput({ argv, env }) {
  const fromArgv = argv?.[2]?.trim();
  if (fromArgv) {
    return fromArgv;
  }

  const fromEnv = env?.MAESTRO_FLOW?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  throw new Error("Provide a Maestro flow path (argv or MAESTRO_FLOW).");
}

export function inferFeatureName(flowPath) {
  const base = path.basename(flowPath, path.extname(flowPath));
  if (!base) {
    throw new Error(`Unable to infer feature name from flow path: ${flowPath}`);
  }
  return base;
}

export function buildFeatureArtifactPaths({ repoRoot, featureName }) {
  const baseDir = path.join(
    repoRoot,
    "mobile",
    ".derived-data",
    "maestro",
    "features",
    featureName
  );

  return {
    resultsXml: path.join(baseDir, "results.xml"),
    artifactsDir: path.join(baseDir, "artifacts"),
    debugDir: path.join(baseDir, "debug")
  };
}

export function buildMaestroFeatureTestArgs({ flowPath, artifactPaths }) {
  return [
    "-p",
    "ios",
    "test",
    flowPath,
    "--format",
    "junit",
    "--output",
    artifactPaths.resultsXml,
    "--test-output-dir",
    artifactPaths.artifactsDir,
    "--debug-output",
    artifactPaths.debugDir,
    "--flatten-debug-output"
  ];
}
