import { Pressable, StyleSheet, Text, View } from "react-native";

export function InsightsScreen({
  isVisible,
  loadVisualizationCard,
  recommendationCard,
  recommendationHistoryCard,
  onOpenHome
}) {
  return (
    <View
      testID="screen-insights"
      style={[styles.screen, !isVisible ? styles.screenHidden : null]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      <View testID="view-joint-load-visualization" style={styles.screen}>
        <Pressable testID="btn-view-main" onPress={onOpenHome} style={styles.shortcutButton}>
          <Text style={styles.shortcutButtonText}>Back to Home</Text>
        </Pressable>
        {loadVisualizationCard}
        {recommendationCard}
        {recommendationHistoryCard}
      </View>
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
