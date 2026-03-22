import { StyleSheet, Text, View } from "react-native";

export function PlaceholderScreenFrame({ title, message, testID }) {
  return (
    <View style={styles.screen} testID={testID}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>UI overhaul shell</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f3ea",
    paddingHorizontal: 20,
    paddingVertical: 24
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d8cfbf",
    backgroundColor: "#fffdfa",
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 8
  },
  eyebrow: {
    color: "#776a55",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  title: {
    color: "#1f3128",
    fontSize: 28,
    fontWeight: "800"
  },
  message: {
    color: "#4a584d",
    fontSize: 15,
    lineHeight: 22
  }
});
