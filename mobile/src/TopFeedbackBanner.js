import { StyleSheet, Text, View } from "react-native";

export function TopFeedbackBanner({ notice }) {
  if (!notice) {
    return null;
  }

  const isError = notice.kind === "error";
  const messageTestId = isError ? "feedback-banner-error" : "feedback-banner-success";

  return (
    <View testID="feedback-banner" style={styles.wrapper}>
      <View style={[styles.banner, isError ? styles.bannerError : styles.bannerSuccess]}>
        <Text
          testID={messageTestId}
          style={[styles.bannerText, isError ? styles.bannerTextError : styles.bannerTextSuccess]}
          accessibilityLiveRegion="polite"
        >
          {notice.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%"
  },
  banner: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    shadowColor: "#082315",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4
  },
  bannerSuccess: {
    backgroundColor: "#e7f7ed",
    borderColor: "#6ab487"
  },
  bannerError: {
    backgroundColor: "#fdeaea",
    borderColor: "#d17878"
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "700"
  },
  bannerTextSuccess: {
    color: "#185c34"
  },
  bannerTextError: {
    color: "#7f2222"
  }
});
