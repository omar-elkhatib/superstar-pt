import test from "node:test";
import assert from "node:assert/strict";
import {
  computeKeyboardAwareScrollOffset,
  computeRevealScrollOffset
} from "../src/scrollBehavior.mjs";

test("computeRevealScrollOffset aligns a newly revealed section near the top", () => {
  const nextOffset = computeRevealScrollOffset({
    targetY: 640,
    topMargin: 24
  });

  assert.equal(nextOffset, 616);
});

test("computeKeyboardAwareScrollOffset keeps the current scroll when the field stays visible", () => {
  const nextOffset = computeKeyboardAwareScrollOffset({
    targetY: 220,
    targetHeight: 44,
    viewportHeight: 700,
    keyboardHeight: 300,
    currentOffset: 0,
    gap: 12
  });

  assert.equal(nextOffset, 0);
});

test("computeKeyboardAwareScrollOffset scrolls enough to keep the field just above the keyboard", () => {
  const nextOffset = computeKeyboardAwareScrollOffset({
    targetY: 680,
    targetHeight: 44,
    viewportHeight: 760,
    keyboardHeight: 320,
    currentOffset: 120,
    gap: 12
  });

  assert.equal(nextOffset, 296);
});
