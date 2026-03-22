import { createElement, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { appHistoryStore } from "../../historyStore.mjs";
import { updateToleranceFromFeedback } from "../../loadModel.mjs";
import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens
} from "../../theme/tokens.mjs";
import {
  AppScreen,
  PrimaryActionButton,
  SectionHeader,
  SegmentedControl,
  SummaryCard
} from "../../components/ui/index.js";
import { buildLogScreenState, createLogDraft, createLogEntryFromDraft } from "./logScreenModel.mjs";

function readStoreState(historyStore) {
  return {
    templates: historyStore.getTemplates(),
    recommendationSnapshots: historyStore.getRecommendationSnapshots()
  };
}

function resolveInitialScreenState(historyStore) {
  const storeState = readStoreState(historyStore);
  const recommendedState = buildLogScreenState({
    mode: "recommended",
    recommendationSnapshots: storeState.recommendationSnapshots,
    templates: storeState.templates
  });
  const mode = recommendedState.prefillCard.status === "ready" ? "recommended" : "manual";

  return {
    storeState,
    mode,
    draft:
      mode === "recommended"
        ? recommendedState.draft
        : createLogDraft({
            mode: "manual",
            templates: storeState.templates
          })
  };
}

function buildResetDraft({ historyStore, mode, painScore }) {
  const storeState = readStoreState(historyStore);

  return {
    storeState,
    draft: createLogDraft({
      mode,
      recommendationSnapshots: storeState.recommendationSnapshots,
      templates: storeState.templates,
      painScore
    })
  };
}

function renderOptionPills({ options, selectedValue, onSelect, testIDPrefix }) {
  return createElement(
    View,
    {
      style: styles.optionRow
    },
    ...options.map((option) =>
      createElement(
        Pressable,
        {
          key: option.value,
          onPress: () => onSelect(option.value),
          style: [
            styles.optionPill,
            selectedValue === option.value ? styles.optionPillSelected : null
          ],
          testID: testIDPrefix ? `${testIDPrefix}-${option.value}` : undefined
        },
        createElement(
          Text,
          {
            style: [
              styles.optionPillLabel,
              selectedValue === option.value ? styles.optionPillLabelSelected : null
            ]
          },
          option.label
        )
      )
    )
  );
}

function renderFieldLabel(text) {
  return createElement(
    Text,
    {
      style: styles.fieldLabel
    },
    text
  );
}

function renderNumericInput({ value, onChangeText, testID }) {
  return createElement(TextInput, {
    keyboardType: "number-pad",
    onChangeText,
    style: styles.textInput,
    testID,
    value
  });
}

export function LogScreen({
  historyStore = appHistoryStore,
  nowFactory = () => new Date().toISOString()
}) {
  const initialState = resolveInitialScreenState(historyStore);
  const [mode, setMode] = useState(initialState.mode);
  const [storeState, setStoreState] = useState(initialState.storeState);
  const [draft, setDraft] = useState(initialState.draft);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const screenState = buildLogScreenState({
    mode,
    recommendationSnapshots: storeState.recommendationSnapshots,
    templates: storeState.templates,
    draft
  });

  function updateDraft(patch) {
    setDraft((current) => ({
      ...current,
      ...patch
    }));
  }

  function handleModeChange(nextMode) {
    const nextState = buildResetDraft({
      historyStore,
      mode: nextMode,
      painScore: draft.painScore
    });

    setMode(nextMode);
    setStoreState(nextState.storeState);
    setDraft(nextState.draft);
    setErrorMessage("");
    setSavedMessage("");
  }

  function handleSelectTemplate(templateId) {
    updateDraft({
      templateId,
      customActivityName: templateId === "custom_activity" ? draft.customActivityName : "",
      customBodyRegion: templateId === "custom_activity" ? draft.customBodyRegion : "full_body",
      customPrimaryJoint: templateId === "custom_activity" ? draft.customPrimaryJoint : "none"
    });
  }

  function handleSave() {
    try {
      const nowIso = nowFactory();
      const entry = createLogEntryFromDraft({
        draft: {
          ...draft,
          mode
        },
        recommendationSnapshots: storeState.recommendationSnapshots,
        templates: storeState.templates,
        nowIso
      });

      historyStore.saveEntry(entry, { nowIso });

      if (entry.recommendationLink) {
        historyStore.saveRecommendationAdherence(
          {
            recommendationId: entry.recommendationLink.recommendationId,
            adherenceStatus: entry.recommendationLink.adherenceStatus,
            entryId: entry.id
          },
          { nowIso }
        );
      }

      const nextToleranceState = updateToleranceFromFeedback({
        toleranceState: historyStore.getToleranceState(),
        entries: historyStore.getEntries(),
        asOfIso: nowIso
      });
      historyStore.setToleranceState(nextToleranceState);

      const nextState = buildResetDraft({
        historyStore,
        mode,
        painScore: draft.painScore
      });

      setStoreState(nextState.storeState);
      setDraft(nextState.draft);
      setErrorMessage("");
      setSavedMessage(
        entry.recommendationLink?.adherenceStatus === "followed"
          ? "Recommended session saved and marked as followed."
          : "Session saved."
      );
    } catch (error) {
      setSavedMessage("");
      setErrorMessage(error instanceof Error ? error.message : "Unable to save this session.");
    }
  }

  const bodyChildren = [
    createElement(SectionHeader, {
      key: "header",
      eyebrow: "Log",
      title: screenState.title,
      subtitle: screenState.subtitle
    }),
    createElement(SegmentedControl, {
      key: "mode-switch",
      options: screenState.modeOptions.map((option) => ({
        value: option.value,
        label: option.label
      })),
      value: mode,
      onChange: handleModeChange,
      testIdPrefix: "log-mode"
    })
  ];

  if (screenState.prefillCard.status !== "hidden") {
    bodyChildren.push(
      createElement(SummaryCard, {
        key: "prefill-card",
        eyebrow: screenState.prefillCard.status === "ready" ? "Recommendation" : "Heads up",
        title: screenState.prefillCard.title,
        description: screenState.prefillCard.summaryText,
        footer: createElement(
          Text,
          {
            style: styles.prefillDetailText
          },
          screenState.prefillCard.detailText
        ),
        testID: "log-prefill-card",
        tone: screenState.prefillCard.status === "ready" ? "accent" : "subtle"
      })
    );
  }

  bodyChildren.push(
    createElement(
      SummaryCard,
      {
        key: "primary-fields",
        eyebrow: "Primary details",
        title: "What you did",
        description: "Keep the first screenful focused on the session itself.",
        testID: "log-primary-fields"
      },
      renderFieldLabel(screenState.fields.activity.label),
      renderOptionPills({
        options: screenState.activityOptions,
        selectedValue: draft.templateId,
        onSelect: handleSelectTemplate,
        testIDPrefix: "log-activity"
      }),
      ...(screenState.customActivityFields.length > 0
        ? screenState.customActivityFields.flatMap((field) => {
            if (field.id === "customActivityName") {
              return [
                renderFieldLabel(field.label),
                createElement(TextInput, {
                  key: field.id,
                  onChangeText: (value) => updateDraft({ customActivityName: value }),
                  style: styles.textInput,
                  testID: "log-custom-activity-name",
                  value: draft.customActivityName
                })
              ];
            }

            return [
              renderFieldLabel(field.label),
              renderOptionPills({
                options: field.options,
                selectedValue: field.value,
                onSelect: (value) =>
                  updateDraft(
                    field.id === "customBodyRegion"
                      ? { customBodyRegion: value }
                      : { customPrimaryJoint: value }
                  ),
                testIDPrefix: `log-${field.id}`
              })
            ];
          })
        : []),
      renderFieldLabel(screenState.fields.variant.label),
      renderOptionPills({
        options: screenState.variantOptions,
        selectedValue: draft.variant,
        onSelect: (value) => updateDraft({ variant: value }),
        testIDPrefix: "log-variant"
      }),
      renderFieldLabel(screenState.fields.duration.label),
      renderNumericInput({
        value: draft.durationMinutes,
        onChangeText: (value) => updateDraft({ durationMinutes: value }),
        testID: "log-duration-input"
      }),
      renderFieldLabel(screenState.fields.effort.label),
      renderNumericInput({
        value: draft.effortScore,
        onChangeText: (value) => updateDraft({ effortScore: value }),
        testID: "log-effort-input"
      }),
      renderFieldLabel(screenState.fields.completion.label),
      renderOptionPills({
        options: screenState.completionOptions,
        selectedValue: draft.completionStatus,
        onSelect: (value) => updateDraft({ completionStatus: value }),
        testIDPrefix: "log-completion"
      }),
      renderFieldLabel(screenState.fields.pain.label),
      renderNumericInput({
        value: draft.painScore,
        onChangeText: (value) => updateDraft({ painScore: value }),
        testID: "log-pain-input"
      })
    )
  );

  bodyChildren.push(
    createElement(
      SummaryCard,
      {
        key: "optional-fields",
        eyebrow: "Optional",
        title: "Extra context",
        description: "Only add these details when they matter for today's session.",
        testID: "log-optional-fields",
        tone: "subtle"
      },
      renderFieldLabel(screenState.fields.jointFeedback.label),
      renderOptionPills({
        options: screenState.jointOptions,
        selectedValue: draft.feedbackJoint,
        onSelect: (value) =>
          updateDraft({
            feedbackJoint: value,
            feedbackScore: value === "none" ? "" : draft.feedbackScore
          }),
        testIDPrefix: "log-joint"
      }),
      ...(draft.feedbackJoint !== "none"
        ? [
            renderFieldLabel("Joint discomfort score (0-10)"),
            renderNumericInput({
              value: draft.feedbackScore,
              onChangeText: (value) => updateDraft({ feedbackScore: value }),
              testID: "log-joint-score-input"
            })
          ]
        : []),
      renderFieldLabel(screenState.fields.notes.label),
      createElement(TextInput, {
        key: "session-note",
        multiline: true,
        onChangeText: (value) => updateDraft({ sessionNote: value }),
        style: [styles.textInput, styles.noteInput],
        testID: "log-session-note-input",
        textAlignVertical: "top",
        value: draft.sessionNote
      })
    )
  );

  const footerChildren = [];
  if (errorMessage) {
    footerChildren.push(
      createElement(
        Text,
        {
          key: "error",
          style: styles.errorText
        },
        errorMessage
      )
    );
  } else if (savedMessage) {
    footerChildren.push(
      createElement(
        Text,
        {
          key: "saved",
          style: styles.savedText
        },
        savedMessage
      )
    );
  }

  footerChildren.push(
    createElement(PrimaryActionButton, {
      key: "save-button",
      label: screenState.saveAction.label,
      hint: screenState.saveAction.hint,
      onPress: handleSave,
      testID: "log-save-button"
    })
  );

  return createElement(
    AppScreen,
    {
      contentContainerStyle: styles.screenContent,
      scrollable: false,
      testID: "screen-log"
    },
    createElement(
      View,
      {
        style: styles.layout
      },
      createElement(
        ScrollView,
        {
          contentContainerStyle: styles.scrollContent,
          keyboardShouldPersistTaps: "handled",
          showsVerticalScrollIndicator: false,
          style: styles.scrollArea,
          testID: "log-screen-scroll"
        },
        ...bodyChildren
      ),
      createElement(
        View,
        {
          style: styles.footer
        },
        ...footerChildren
      )
    )
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingBottom: spacingTokens.md
  },
  layout: {
    flex: 1,
    gap: spacingTokens.md
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    gap: spacingTokens.md,
    paddingBottom: spacingTokens.sm
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingTokens.xs
  },
  optionPill: {
    borderRadius: radiusTokens.pill,
    borderWidth: 1,
    borderColor: colorTokens.borderSubtle,
    backgroundColor: colorTokens.surfaceMuted,
    paddingHorizontal: spacingTokens.sm,
    paddingVertical: spacingTokens.xs
  },
  optionPillSelected: {
    backgroundColor: colorTokens.accentSoft,
    borderColor: colorTokens.borderStrong
  },
  optionPillLabel: {
    ...typographyTokens.body,
    fontSize: 14,
    lineHeight: 18
  },
  optionPillLabelSelected: {
    color: colorTokens.accentSoftText,
    fontWeight: "700"
  },
  fieldLabel: {
    ...typographyTokens.caption,
    color: colorTokens.textSecondary,
    fontWeight: "700"
  },
  textInput: {
    minHeight: 48,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.borderSubtle,
    backgroundColor: colorTokens.surface,
    color: colorTokens.textPrimary,
    paddingHorizontal: spacingTokens.sm,
    paddingVertical: spacingTokens.xs,
    fontSize: 16
  },
  noteInput: {
    minHeight: 96
  },
  prefillDetailText: {
    ...typographyTokens.caption,
    color: colorTokens.accentSoftText,
    fontWeight: "700"
  },
  footer: {
    gap: spacingTokens.xs,
    paddingTop: spacingTokens.xs,
    borderTopWidth: 1,
    borderTopColor: colorTokens.borderSubtle
  },
  errorText: {
    ...typographyTokens.caption,
    color: "#a23535",
    fontWeight: "700"
  },
  savedText: {
    ...typographyTokens.caption,
    color: "#20603f",
    fontWeight: "700"
  }
});
