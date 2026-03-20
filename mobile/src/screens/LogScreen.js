import { StyleSheet, View } from "react-native";

export function LogScreen({ isVisible, addSessionCard }) {
  return (
    <View
      testID="screen-log"
      style={[styles.screen, !isVisible ? styles.screenHidden : null]}
      pointerEvents={isVisible ? "auto" : "none"}
    >
      {addSessionCard}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18 },
  screenHidden: { display: "none" }
});

