import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  findLatestScreenshotsDir,
  findLatestXcresult,
  planOutputFiles
} from "../scripts/export-ui-screenshots-lib.mjs";

test("planOutputFiles builds stable png names from xcresult manifest", () => {
  const manifest = [
    {
      testIdentifier: "SuperstarPTUITests/testAdaptiveCheckInFlowCapturesScreenshots()",
      attachments: [
        {
          exportedFileName: "abc123.png",
          suggestedHumanReadableName: "after_swipe_0_ABC-DEF.png"
        },
        {
          exportedFileName: "def456.jpg",
          suggestedHumanReadableName: "home screen?.jpg"
        }
      ]
    }
  ];

  const planned = planOutputFiles(manifest);

  assert.deepEqual(planned, [
    {
      exportedFileName: "abc123.png",
      outputFileName: "after_swipe_0_ABC-DEF.png"
    },
    {
      exportedFileName: "def456.jpg",
      outputFileName: "home_screen_.png"
    }
  ]);
});

test("findLatestXcresult returns most recently modified UIFeedback release bundle", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "xcresult-test-"));
  try {
    const older = path.join(root, "UIFeedback-release-20260101-120000.xcresult");
    const newer = path.join(root, "UIFeedback-release-20260101-120500.xcresult");
    fs.mkdirSync(older);
    fs.mkdirSync(newer);

    const now = Date.now();
    fs.utimesSync(older, now / 1000 - 10, now / 1000 - 10);
    fs.utimesSync(newer, now / 1000, now / 1000);

    const latest = findLatestXcresult(root);
    assert.equal(latest, newer);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("findLatestScreenshotsDir returns most recently modified screenshot directory", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "screenshots-test-"));
  try {
    const screenshotsRoot = path.join(root, "ui-screenshots");
    fs.mkdirSync(screenshotsRoot);
    const older = path.join(screenshotsRoot, "UIFeedback-release-older");
    const newer = path.join(screenshotsRoot, "UIFeedback-release-newer");
    fs.mkdirSync(older);
    fs.mkdirSync(newer);

    const now = Date.now();
    fs.utimesSync(older, now / 1000 - 10, now / 1000 - 10);
    fs.utimesSync(newer, now / 1000, now / 1000);

    const latest = findLatestScreenshotsDir(root);
    assert.equal(latest, newer);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
