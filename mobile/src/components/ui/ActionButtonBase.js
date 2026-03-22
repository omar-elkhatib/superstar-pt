import { createElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens
} from "../../theme/tokens.mjs";

function renderLabelContent({
  children,
  hint,
  label,
  leadingAccessory,
  trailingAccessory,
  textColor
}) {
  const rowChildren = [];

  if (leadingAccessory) {
    rowChildren.push(createElement(View, { key: "leading", style: styles.accessory }, leadingAccessory));
  }

  const textStackChildren = [];
  if (children != null) {
    textStackChildren.push(createElement(View, { key: "custom-content" }, children));
  } else if (label) {
    textStackChildren.push(
      createElement(
        Text,
        {
          key: "label",
          style: [styles.label, { color: textColor }]
        },
        label
      )
    );
  }

  if (hint) {
    textStackChildren.push(
      createElement(
        Text,
        {
          key: "hint",
          style: [styles.hint, { color: textColor }]
        },
        hint
      )
    );
  }

  rowChildren.push(createElement(View, { key: "text-stack", style: styles.textStack }, ...textStackChildren));

  if (trailingAccessory) {
    rowChildren.push(
      createElement(View, { key: "trailing", style: styles.accessory }, trailingAccessory)
    );
  }

  return createElement(View, { style: styles.contentRow }, ...rowChildren);
}

export function ActionButtonBase({
  children,
  disabled = false,
  hint,
  label,
  leadingAccessory,
  onPress,
  style,
  testID,
  trailingAccessory,
  variant = "primary"
}) {
  const isPrimary = variant === "primary";
  const textColor = isPrimary ? colorTokens.accentOnPrimary : colorTokens.accentPrimary;

  return createElement(
    Pressable,
    {
      accessibilityRole: "button",
      disabled,
      onPress,
      testID,
      style: ({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !disabled ? (isPrimary ? styles.primaryPressed : styles.secondaryPressed) : null,
        disabled ? styles.disabled : null,
        style
      ]
    },
    renderLabelContent({
      children,
      hint,
      label,
      leadingAccessory,
      trailingAccessory,
      textColor
    })
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.sm,
    justifyContent: "center"
  },
  primary: {
    backgroundColor: colorTokens.accentPrimary
  },
  primaryPressed: {
    backgroundColor: colorTokens.accentPrimaryPressed
  },
  secondary: {
    backgroundColor: colorTokens.accentSoft,
    borderWidth: 1,
    borderColor: colorTokens.borderStrong
  },
  secondaryPressed: {
    backgroundColor: colorTokens.surfaceAccent
  },
  disabled: {
    opacity: 0.55
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacingTokens.sm
  },
  textStack: {
    alignItems: "center",
    gap: spacingTokens.xxs
  },
  accessory: {
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    ...typographyTokens.buttonLabel,
    textAlign: "center"
  },
  hint: {
    ...typographyTokens.caption,
    textAlign: "center"
  }
});
