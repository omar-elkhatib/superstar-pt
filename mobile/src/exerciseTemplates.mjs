export const DEFAULT_EXERCISE_TEMPLATES = [
  {
    id: "walking",
    name: "Walking",
    defaultBodyRegions: ["lower_body", "cardio"],
    jointProfile: {
      base: {
        ankle: { direct: 0.22, indirect: 0.05 },
        knee: { direct: 0.21, indirect: 0.05 },
        hip: { direct: 0.18, indirect: 0.05 },
        spine: { direct: 0.08, indirect: 0.04 }
      }
    }
  },
  {
    id: "jogging",
    name: "Jogging",
    defaultBodyRegions: ["lower_body", "cardio"],
    jointProfile: {
      base: {
        ankle: { direct: 0.26, indirect: 0.06 },
        knee: { direct: 0.25, indirect: 0.06 },
        hip: { direct: 0.2, indirect: 0.06 },
        spine: { direct: 0.11, indirect: 0.04 }
      }
    }
  },
  {
    id: "squat",
    name: "Squat",
    defaultBodyRegions: ["legs", "glutes"],
    jointProfile: {
      base: {
        ankle: { direct: 0.15, indirect: 0.04 },
        knee: { direct: 0.27, indirect: 0.05 },
        hip: { direct: 0.25, indirect: 0.05 },
        spine: { direct: 0.09, indirect: 0.03 }
      },
      supported: {
        ankle: { direct: 0.11, indirect: 0.03 },
        knee: { direct: 0.21, indirect: 0.04 },
        hip: { direct: 0.2, indirect: 0.05 },
        spine: { direct: 0.07, indirect: 0.03 }
      }
    }
  },
  {
    id: "lunge",
    name: "Lunge",
    defaultBodyRegions: ["legs", "glutes"],
    jointProfile: {
      base: {
        ankle: { direct: 0.18, indirect: 0.04 },
        knee: { direct: 0.28, indirect: 0.05 },
        hip: { direct: 0.24, indirect: 0.05 },
        spine: { direct: 0.08, indirect: 0.03 }
      },
      supported: {
        ankle: { direct: 0.13, indirect: 0.03 },
        knee: { direct: 0.22, indirect: 0.04 },
        hip: { direct: 0.2, indirect: 0.04 },
        spine: { direct: 0.07, indirect: 0.03 }
      }
    }
  },
  {
    id: "deadlift",
    name: "Deadlift",
    defaultBodyRegions: ["posterior_chain", "legs"],
    jointProfile: {
      base: {
        ankle: { direct: 0.1, indirect: 0.03 },
        knee: { direct: 0.18, indirect: 0.04 },
        hip: { direct: 0.27, indirect: 0.05 },
        spine: { direct: 0.2, indirect: 0.05 }
      },
      supported: {
        ankle: { direct: 0.06, indirect: 0.02 },
        knee: { direct: 0.14, indirect: 0.03 },
        hip: { direct: 0.23, indirect: 0.05 },
        spine: { direct: 0.15, indirect: 0.04 }
      }
    }
  },
  {
    id: "cycling",
    name: "Cycling",
    defaultBodyRegions: ["lower_body", "cardio"],
    jointProfile: {
      base: {
        ankle: { direct: 0.06, indirect: 0.03 },
        knee: { direct: 0.2, indirect: 0.04 },
        hip: { direct: 0.16, indirect: 0.04 },
        spine: { direct: 0.06, indirect: 0.03 }
      },
      seated: {
        ankle: { direct: 0.03, indirect: 0.02 },
        knee: { direct: 0.18, indirect: 0.04 },
        hip: { direct: 0.17, indirect: 0.04 },
        spine: { direct: 0.07, indirect: 0.03 }
      }
    }
  },
  {
    id: "seated_hip_abduction",
    name: "Seated Hip Abduction",
    defaultBodyRegions: ["hips", "glutes"],
    jointProfile: {
      base: {
        ankle: { direct: 0.05, indirect: 0.02 },
        knee: { direct: 0.07, indirect: 0.02 },
        hip: { direct: 0.28, indirect: 0.04 },
        spine: { direct: 0.05, indirect: 0.02 }
      },
      seated: {
        ankle: { direct: 0, indirect: 0 },
        knee: { direct: 0.03, indirect: 0.01 },
        hip: { direct: 0.31, indirect: 0.04 },
        spine: { direct: 0.05, indirect: 0.02 }
      }
    }
  },
  {
    id: "push_up",
    name: "Push Up",
    defaultBodyRegions: ["chest", "arms"],
    jointProfile: {
      base: {
        shoulder: { direct: 0.22, indirect: 0.05 },
        elbow: { direct: 0.2, indirect: 0.04 },
        wrist: { direct: 0.17, indirect: 0.04 },
        spine: { direct: 0.07, indirect: 0.03 }
      },
      supported: {
        shoulder: { direct: 0.17, indirect: 0.04 },
        elbow: { direct: 0.15, indirect: 0.03 },
        wrist: { direct: 0.1, indirect: 0.03 },
        spine: { direct: 0.06, indirect: 0.03 }
      }
    }
  },
  {
    id: "row",
    name: "Row",
    defaultBodyRegions: ["back", "arms"],
    jointProfile: {
      base: {
        shoulder: { direct: 0.2, indirect: 0.04 },
        elbow: { direct: 0.18, indirect: 0.04 },
        wrist: { direct: 0.1, indirect: 0.03 },
        spine: { direct: 0.08, indirect: 0.03 }
      },
      seated: {
        shoulder: { direct: 0.19, indirect: 0.04 },
        elbow: { direct: 0.17, indirect: 0.04 },
        wrist: { direct: 0.09, indirect: 0.03 },
        spine: { direct: 0.06, indirect: 0.03 }
      }
    }
  },
  {
    id: "overhead_press",
    name: "Overhead Press",
    defaultBodyRegions: ["shoulders", "arms"],
    jointProfile: {
      base: {
        shoulder: { direct: 0.28, indirect: 0.05 },
        elbow: { direct: 0.15, indirect: 0.04 },
        wrist: { direct: 0.08, indirect: 0.03 },
        spine: { direct: 0.08, indirect: 0.03 }
      },
      seated: {
        shoulder: { direct: 0.27, indirect: 0.05 },
        elbow: { direct: 0.14, indirect: 0.04 },
        wrist: { direct: 0.07, indirect: 0.03 },
        spine: { direct: 0.05, indirect: 0.02 }
      }
    }
  }
];

export function findTemplateById(templateId) {
  return DEFAULT_EXERCISE_TEMPLATES.find((item) => item.id === templateId) || null;
}
