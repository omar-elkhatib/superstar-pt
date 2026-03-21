import path from "node:path";

export function buildMaestroHomePath({ repoRoot, env }) {
  const fromEnv = env?.MAESTRO_USER_HOME?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  return path.join(repoRoot, "mobile", ".derived-data", "maestro-home");
}

export function buildMaestroEnv({ repoRoot, env }) {
  const maestroHome = buildMaestroHomePath({ repoRoot, env });
  const maestroOpts = env?.MAESTRO_OPTS?.trim() || "";
  const hasUserHomeOverride = /(?:^|\s)-Duser\.home=/.test(maestroOpts);

  return {
    ...env,
    MAESTRO_CLI_NO_ANALYTICS: env?.MAESTRO_CLI_NO_ANALYTICS || "1",
    MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED:
      env?.MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED || "true",
    MAESTRO_OPTS: hasUserHomeOverride
      ? maestroOpts
      : [maestroOpts, `-Duser.home=${maestroHome}`].filter(Boolean).join(" ")
  };
}
