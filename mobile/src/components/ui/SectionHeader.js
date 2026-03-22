import { createElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  spacingTokens,
  typographyTokens
} from "../../theme/tokens.mjs";

/*
 * Prop contract: compact section heading with optional eyebrow, subtitle, and trailing action.
 * Accepts eyebrow, title, subtitle, action, testID, and style.
 */
export function SectionHeader({ action, eyebrow, style, subtitle, testID, title }) {
  const leadingChildren = [];

  if (eyebrow) {
    leadingChildren.push(
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

  if (title) {
    leadingChildren.push(
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

  if (subtitle) {
    leadingChildren.push(
      createElement(
        Text,
        {
          key: "subtitle",
          style: styles.subtitle
        },
        subtitle
      )
    );
  }

  const rowChildren = [
    createElement(View, { key: "content", style: styles.contentStack }, ...leadingChildren)
  ];

  if (action) {
    rowChildren.push(createElement(View, { key: "action", style: styles.actionSlot }, action));
  }

  return createElement(
    View,
    {
      style: [styles.wrapper, style],
      testID
    },
    ...rowChildren
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacingTokens.md
  },
  contentStack: {
    flex: 1,
    gap: spacingTokens.xxs
  },
  eyebrow: {
    ...typographyTokens.eyebrow
  },
  title: {
    ...typographyTokens.sectionTitle
  },
  subtitle: {
    ...typographyTokens.body
  },
  actionSlot: {
    alignItems: "flex-end",
    justifyContent: "center"
  }
});
