import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { TopFeedbackBanner } from "./src/TopFeedbackBanner";

const feedbackNotice = null;

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.feedbackSafeArea}>
          <View style={styles.feedbackHost}>
            <TopFeedbackBanner notice={feedbackNotice} />
          </View>
        </SafeAreaView>

        <View style={styles.navigatorHost}>
          <AppNavigator />
        </View>

        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f4f0e6"
  },
  feedbackSafeArea: {
    backgroundColor: "#f4f0e6"
  },
  feedbackHost: {
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  navigatorHost: {
    flex: 1
  }
});
