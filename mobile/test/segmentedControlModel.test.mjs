import test from "node:test";
import assert from "node:assert/strict";
import { buildSegmentedControlItems } from "../src/components/ui/segmentedControlModel.mjs";

test("segmented control model marks only the active option and preserves stable test ids", () => {
  const items = buildSegmentedControlItems({
    value: "load",
    options: [
      { value: "timeline", label: "Timeline", testID: "progress-segment-timeline" },
      { value: "load", label: "Load", testID: "progress-segment-load" }
    ]
  });

  assert.equal(items.length, 2);
  assert.equal(items[0].isSelected, false);
  assert.equal(items[1].isSelected, true);
  assert.deepEqual(items[0].accessibilityState, { selected: false, disabled: false });
  assert.deepEqual(items[1].accessibilityState, { selected: true, disabled: false });
  assert.equal(items[0].testID, "progress-segment-timeline");
  assert.equal(items[1].testID, "progress-segment-load");
});

test("segmented control model can derive screen-friendly test ids from a shared prefix", () => {
  const items = buildSegmentedControlItems({
    value: "timeline",
    testIdPrefix: "progress-segment",
    options: [
      { value: "timeline", label: "Timeline" },
      { value: "load", label: "Load", disabled: true }
    ]
  });

  assert.equal(items[0].testID, "progress-segment-timeline");
  assert.equal(items[1].testID, "progress-segment-load");
  assert.equal(items[0].isSelected, true);
  assert.deepEqual(items[1].accessibilityState, { selected: false, disabled: true });
});
