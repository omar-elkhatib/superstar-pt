import { createElement } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import {
  colorTokens,
  layoutTokens,
  spacingTokens
} from "../../theme/tokens.mjs";

function renderContent({
  children,
  contentContainerStyle,
  contentTestID,
  keyboardShouldPersistTaps,
  scrollable
}) {
  if (scrollable) {
    return createElement(
      ScrollView,
      {
        keyboardShouldPersistTaps,
        showsVerticalScrollIndicator: false,
        style: styles.fill,
        testID: contentTestID,
        contentContainerStyle: [styles.content, styles.scrollContent, contentContainerStyle]
      },
      children
    );
  }

  return createElement(
    View,
    {
      style: [styles.content, contentContainerStyle],
      testID: contentTestID
    },
    children
  );
}

/*
 * Prop contract: generic screen chrome with optional scrolling.
 * Accepts children, testID, contentTestID, scrollable, style, and contentContainerStyle.
 */
export function AppScreen({
  children,
  contentContainerStyle,
  contentTestID,
  keyboardShouldPersistTaps = "handled",
  scrollable = true,
  style,
  testID
}) {
  return createElement(
    SafeAreaView,
    {
      style: [styles.screen, style],
      testID
    },
    renderContent({
      children,
      contentContainerStyle,
      contentTestID,
      keyboardShouldPersistTaps,
      scrollable
    })
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorTokens.background
  },
  fill: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: layoutTokens.screenMaxWidth,
    alignSelf: "center",
    paddingHorizontal: spacingTokens.screenHorizontal,
    paddingVertical: spacingTokens.screenVertical,
    gap: layoutTokens.sectionGap
  },
  scrollContent: {
    paddingBottom: spacingTokens.xxl
  }
});
