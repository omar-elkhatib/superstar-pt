import { StyleSheet, View } from "react-native";

export function HistoryScreen({ isVisible, sessionBrowserCard }) {
  return (
    <View
      testID="screen-history"
      style={[styles.screen, !isVisible ? styles.screenHidden : null]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {sessionBrowserCard}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  screenHidden: { display: "none" }
});

