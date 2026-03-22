import test from "node:test";
import assert from "node:assert/strict";
import {
  CUSTOM_ACTIVITY_TEMPLATE_ID,
  createSyntheticTemplateForEntry,
  getEntryActivityLabel
} from "../src/activityEntryMetadata.mjs";
import { DEFAULT_EXERCISE_TEMPLATES } from "../src/exerciseTemplates.mjs";

test("getEntryActivityLabel prefers a custom activity name over the template id", () => {
  const label = getEntryActivityLabel({
    entry: {
      templateId: CUSTOM_ACTIVITY_TEMPLATE_ID,
      customActivity: {
        name: "Elliptical intervals"
      }
    },
    templates: DEFAULT_EXERCISE_TEMPLATES
  });

  assert.equal(label, "Custom: Elliptical intervals");
});

test("createSyntheticTemplateForEntry builds a usable load profile for custom entries", () => {
  const template = createSyntheticTemplateForEntry({
    templateId: CUSTOM_ACTIVITY_TEMPLATE_ID,
    customActivity: {
      name: "Pool running",
      bodyRegion: "cardio",
      primaryJoint: "hip"
    }
  });

  assert.equal(template.id, CUSTOM_ACTIVITY_TEMPLATE_ID);
  assert.equal(template.name, "Pool running");
  assert.ok(template.jointProfile.base.hip.direct > template.jointProfile.base.spine.direct);
  assert.ok(template.jointProfile.seated.hip.direct < template.jointProfile.base.hip.direct);
});
