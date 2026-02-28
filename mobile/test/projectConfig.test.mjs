import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("mobile package config is compatible with Expo entrypoint", () => {
  const raw = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
  const pkg = JSON.parse(raw);

  assert.notEqual(
    pkg.type,
    "module",
    "Do not set type=module in mobile/package.json; Expo AppEntry is CommonJS."
  );
});

