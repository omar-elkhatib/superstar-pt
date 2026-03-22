import { createElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  colorTokens,
  layoutTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens
} from "../../theme/tokens.mjs";

function resolveToneStyle(tone) {
  switch (tone) {
    case "accent":
      return styles.cardAccent;
    case "subtle":
      return styles.cardSubtle;
    default:
      return styles.cardDefault;
  }
}

/*
 * Prop contract: card primitive for reusable summary content.
 * Accepts eyebrow, title, value, description, children, footer, action, tone, testID, and style.
 */
export function SummaryCard({
  action,
  children,
  description,
  eyebrow,
  footer,
  style,
  testID,
  title,
  tone = "default",
  value
}) {
  const cardChildren = [];

  if (eyebrow) {
    cardChildren.push(
      createElement(
        Text,
        {
          key: "eyebrow",
          style: styles.eyebrow
        },
        eyebrow
      )
    );
  }

  if (title || action) {
    const headerChildren = [];

    if (title) {
      headerChildren.push(
        createElement(
          Text,
          {
            key: "title",
            style: styles.title
          },
          title
        )
      );
    }

    if (action) {
      headerChildren.push(
        createElement(View, { key: "action", style: styles.actionSlot }, action)
      );
    }

    cardChildren.push(createElement(View, { key: "header", style: styles.headerRow }, ...headerChildren));
  }

  if (value != null) {
    cardChildren.push(
      createElement(
        Text,
        {
          key: "value",
          style: styles.value
        },
        String(value)
      )
    );
  }

  if (description) {
    cardChildren.push(
      createElement(
        Text,
        {
          key: "description",
          style: styles.description
        },
        description
      )
    );
  }

  if (children != null) {
    cardChildren.push(createElement(View, { key: "content", style: styles.contentSlot }, children));
  }

  if (footer) {
    cardChildren.push(createElement(View, { key: "footer", style: styles.footerSlot }, footer));
  }

  return createElement(
    View,
    {
      style: [styles.card, resolveToneStyle(tone), style],
      testID
    },
    ...cardChildren
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radiusTokens.card,
    padding: spacingTokens.lg,
    gap: layoutTokens.cardGap,
    borderWidth: 1,
    ...shadowTokens.card
  },
  cardDefault: {
    backgroundColor: colorTokens.surface,
    borderColor: colorTokens.borderSubtle
  },
  cardAccent: {
    backgroundColor: colorTokens.surfaceAccent,
    borderColor: colorTokens.borderStrong
  },
  cardSubtle: {
    backgroundColor: colorTokens.surfaceMuted,
    borderColor: colorTokens.borderSubtle
  },
  eyebrow: {
    ...typographyTokens.eyebrow
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacingTokens.md
  },
  title: {
    ...typographyTokens.sectionTitle,
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 26
  },
  actionSlot: {
    alignItems: "flex-end",
    justifyContent: "center"
  },
  value: {
    ...typographyTokens.heroValue
  },
  description: {
    ...typographyTokens.body
  },
  contentSlot: {
    gap: spacingTokens.sm
  },
  footerSlot: {
    paddingTop: spacingTokens.xs
  }
});
