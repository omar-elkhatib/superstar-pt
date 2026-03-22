import { createElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from "../../theme/tokens.mjs";
import { buildSegmentedControlItems } from "./segmentedControlModel.mjs";

function renderSegment(item, onChange) {
  return createElement(
    Pressable,
    {
      accessibilityRole: "button",
      accessibilityState: item.accessibilityState,
      disabled: item.isDisabled,
      key: item.key,
      onPress: () => {
        if (!item.isDisabled && !item.isSelected) {
          onChange?.(item.value);
        }
      },
      style: ({ pressed }) => [
        styles.segment,
        item.isSelected ? styles.segmentSelected : null,
        pressed && !item.isSelected && !item.isDisabled ? styles.segmentPressed : null,
        item.isDisabled ? styles.segmentDisabled : null
      ],
      testID: item.testID
    },
    createElement(
      Text,
      {
        style: [styles.segmentLabel, item.isSelected ? styles.segmentLabelSelected : null]
      },
      item.label
    )
  );
}

/*
 * Prop contract: pill segmented control for small mutually-exclusive view switches.
 * Accepts options, value, onChange, testID, testIdPrefix, and style.
 */
export function SegmentedControl({ onChange, options, style, testID, testIdPrefix, value }) {
  const items = buildSegmentedControlItems({
    options,
    testIdPrefix,
    value
  });

  return createElement(
    View,
    {
      style: [styles.track, style],
      testID
    },
    ...items.map((item) => renderSegment(item, onChange))
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacingTokens.xxs,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.segmentedTrack,
    gap: spacingTokens.xxs
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.xs,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentSelected: {
    backgroundColor: colorTokens.surface,
    ...shadowTokens.segment
  },
  segmentPressed: {
    backgroundColor: colorTokens.surfaceAccent
  },
  segmentDisabled: {
    opacity: 0.45
  },
  segmentLabel: {
    ...typographyTokens.buttonLabel,
    color: colorTokens.textSecondary,
    fontSize: 15,
    lineHeight: 18
  },
  segmentLabelSelected: {
    color: colorTokens.textPrimary
  }
});
