import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { buildMaestroEnv } from "../scripts/ios-maestro-run-lib.mjs";

test("buildMaestroEnv defaults Maestro to a repo-local writable home", () => {
  const env = buildMaestroEnv({
    repoRoot: "/repo/root",
    env: {
      PATH: "/usr/bin",
      MAESTRO_CLI_NO_ANALYTICS: ""
    }
  });

  assert.equal(env.PATH, "/usr/bin");
  assert.equal(env.MAESTRO_CLI_NO_ANALYTICS, "1");
  assert.equal(env.MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED, "true");
  assert.equal(
    env.MAESTRO_OPTS,
    `-Duser.home=${path.join("/repo/root", "mobile", ".derived-data", "maestro-home")}`
  );
});

test("buildMaestroEnv appends a repo-local user.home when Maestro options already exist", () => {
  const env = buildMaestroEnv({
    repoRoot: "/repo/root",
    env: {
      MAESTRO_OPTS: "-Dfoo=bar"
    }
  });

  assert.equal(
    env.MAESTRO_OPTS,
    `-Dfoo=bar -Duser.home=${path.join("/repo/root", "mobile", ".derived-data", "maestro-home")}`
  );
});

test("buildMaestroEnv respects an existing user.home override", () => {
  const env = buildMaestroEnv({
    repoRoot: "/repo/root",
    env: {
      MAESTRO_OPTS: "-Dfoo=bar -Duser.home=/tmp/custom-home"
    }
  });

  assert.equal(env.MAESTRO_OPTS, "-Dfoo=bar -Duser.home=/tmp/custom-home");
});
