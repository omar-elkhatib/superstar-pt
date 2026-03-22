export const CUSTOM_ACTIVITY_TEMPLATE_ID = "custom_activity";
export const CUSTOM_ACTIVITY_BODY_REGION_OPTIONS = [
  "lower_body",
  "upper_body",
  "full_body",
  "cardio",
  "mobility"
];

const JOINT_IDS = [
  "ankle",
  "knee",
  "hip",
  "spine",
  "neck",
  "shoulder",
  "elbow",
  "wrist"
];

const REGION_PROFILES = {
  lower_body: {
    ankle: { direct: 0.12, indirect: 0.03 },
    knee: { direct: 0.15, indirect: 0.04 },
    hip: { direct: 0.13, indirect: 0.04 },
    spine: { direct: 0.05, indirect: 0.02 }
  },
  upper_body: {
    shoulder: { direct: 0.16, indirect: 0.04 },
    elbow: { direct: 0.12, indirect: 0.03 },
    wrist: { direct: 0.08, indirect: 0.02 },
    spine: { direct: 0.05, indirect: 0.02 }
  },
  full_body: {
    ankle: { direct: 0.08, indirect: 0.02 },
    knee: { direct: 0.09, indirect: 0.02 },
    hip: { direct: 0.09, indirect: 0.02 },
    spine: { direct: 0.06, indirect: 0.02 },
    shoulder: { direct: 0.08, indirect: 0.02 },
    elbow: { direct: 0.06, indirect: 0.02 },
    wrist: { direct: 0.04, indirect: 0.01 }
  },
  cardio: {
    ankle: { direct: 0.11, indirect: 0.03 },
    knee: { direct: 0.12, indirect: 0.03 },
    hip: { direct: 0.12, indirect: 0.03 },
    spine: { direct: 0.04, indirect: 0.02 }
  },
  mobility: {
    neck: { direct: 0.03, indirect: 0.01 },
    shoulder: { direct: 0.05, indirect: 0.01 },
    spine: { direct: 0.05, indirect: 0.02 },
    hip: { direct: 0.05, indirect: 0.02 },
    knee: { direct: 0.03, indirect: 0.01 }
  }
};

function scaleProfile(profile, multiplier) {
  const next = {};
  for (const jointId of JOINT_IDS) {
    const weight = profile[jointId] || { direct: 0, indirect: 0 };
    next[jointId] = {
      direct: Number((weight.direct * multiplier).toFixed(3)),
      indirect: Number((weight.indirect * multiplier).toFixed(3))
    };
  }
  return next;
}

function boostPrimaryJoint(profile, primaryJoint) {
  if (!JOINT_IDS.includes(primaryJoint)) {
    return profile;
  }

  const current = profile[primaryJoint] || { direct: 0, indirect: 0 };
  return {
    ...profile,
    [primaryJoint]: {
      direct: Number((current.direct + 0.08).toFixed(3)),
      indirect: Number((current.indirect + 0.02).toFixed(3))
    }
  };
}

function getBaseProfileForBodyRegion(bodyRegion) {
  const regionKey = CUSTOM_ACTIVITY_BODY_REGION_OPTIONS.includes(bodyRegion)
    ? bodyRegion
    : "full_body";
  return scaleProfile(REGION_PROFILES[regionKey] || REGION_PROFILES.full_body, 1);
}

export function createSyntheticTemplateForEntry(entry) {
  const customActivity = entry?.customActivity || {};
  const baseProfile = boostPrimaryJoint(
    getBaseProfileForBodyRegion(customActivity.bodyRegion),
    customActivity.primaryJoint
  );

  return {
    id: CUSTOM_ACTIVITY_TEMPLATE_ID,
    name: customActivity.name || "Custom activity",
    defaultBodyRegions: [customActivity.bodyRegion || "full_body"],
    jointProfile: {
      base: baseProfile,
      seated: scaleProfile(baseProfile, 0.78),
      supported: scaleProfile(baseProfile, 0.84)
    }
  };
}

export function resolveTemplateForEntry({ entry, templates = [] } = {}) {
  if (!entry) {
    return null;
  }

  if (entry.templateId === CUSTOM_ACTIVITY_TEMPLATE_ID) {
    return createSyntheticTemplateForEntry(entry);
  }

  return templates.find((template) => template.id === entry.templateId) || null;
}

export function getEntryActivityLabel({ entry, templates = [] } = {}) {
  if (!entry) {
    return "";
  }

  if (entry.templateId === CUSTOM_ACTIVITY_TEMPLATE_ID) {
    const customName = String(entry.customActivity?.name || "").trim();
    return customName ? `Custom: ${customName}` : "Custom activity";
  }

  return (
    templates.find((template) => template.id === entry.templateId)?.name || entry.templateId || ""
  );
}
