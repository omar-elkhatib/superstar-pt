import { Pressable, StyleSheet, Text, View } from "react-native";

export function HomeScreen({
  isVisible,
  onboardingBaselineCard,
  followUpInboxCard,
  dailyCheckInCard,
  recommendationCard,
  recommendationHistoryCard,
  followUpCard,
  onOpenInsights
}) {
  return (
    <View
      testID="screen-home"
      style={[styles.screen, !isVisible ? styles.screenHidden : null]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {onboardingBaselineCard}
      {followUpInboxCard}
      {dailyCheckInCard}
      {recommendationCard}
      {recommendationHistoryCard}
      {followUpCard}
      <Pressable
        testID="btn-view-visualization"
        onPress={onOpenInsights}
        style={styles.shortcutButton}
      >
        <Text style={styles.shortcutButtonText}>Open joint-load visualization</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  screenHidden: { display: "none" },
  shortcutButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#deebe3"
  },
  shortcutButtonText: { color: "#1d4c38", fontWeight: "700" }
});
