import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { adaptSession } from "./src/adaptivePlan.mjs";

const READINESS_OPTIONS = ["low", "medium", "high"];

export default function App() {
  const [currentPain, setCurrentPain] = useState("4");
  const [priorPain, setPriorPain] = useState("2");
  const [readiness, setReadiness] = useState("medium");
  const [symptomWorsenedIn24h, setSymptomWorsenedIn24h] = useState(false);

  const recommendation = useMemo(
    () =>
      adaptSession({
        currentPain: Number(currentPain) || 0,
        priorPain: Number(priorPain) || 0,
        readiness,
        symptomWorsenedIn24h
      }),
    [currentPain, priorPain, readiness, symptomWorsenedIn24h]
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Superstar PT</Text>
        <Text style={styles.subtitle}>Adaptive daily training check-in</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Current pain (0-10)</Text>
          <TextInput
            value={currentPain}
            onChangeText={setCurrentPain}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Prior pain (0-10)</Text>
          <TextInput
            value={priorPain}
            onChangeText={setPriorPain}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Readiness</Text>
          <View style={styles.row}>
            {READINESS_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setReadiness(option)}
                style={[
                  styles.pill,
                  readiness === option ? styles.pillActive : styles.pillInactive
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    readiness === option
                      ? styles.pillTextActive
                      : styles.pillTextInactive
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Symptoms worsened in 24h</Text>
            <Switch
              value={symptomWorsenedIn24h}
              onValueChange={setSymptomWorsenedIn24h}
            />
          </View>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Today&apos;s recommendation</Text>
          <Text style={styles.resultItem}>Action: {recommendation.action}</Text>
          <Text style={styles.resultItem}>
            Intensity: x{recommendation.intensityMultiplier}
          </Text>
          <Text style={styles.resultText}>{recommendation.recommendation}</Text>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f7f3" },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    gap: 18
  },
  title: { fontSize: 34, fontWeight: "700", color: "#0d3b2a" },
  subtitle: { fontSize: 16, color: "#245f48" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  label: { fontSize: 14, color: "#1a3d30", fontWeight: "600" },
  input: {
    backgroundColor: "#f4f7f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  row: { flexDirection: "row", gap: 8 },
  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  pillActive: { backgroundColor: "#0f6b47" },
  pillInactive: { backgroundColor: "#deebe3" },
  pillText: { fontSize: 14, textTransform: "capitalize" },
  pillTextActive: { color: "#ffffff", fontWeight: "700" },
  pillTextInactive: { color: "#1d4c38", fontWeight: "600" },
  switchRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  resultCard: {
    backgroundColor: "#0d3b2a",
    borderRadius: 16,
    padding: 16,
    gap: 8
  },
  resultTitle: { color: "#d2ffe7", fontSize: 18, fontWeight: "700" },
  resultItem: { color: "#ffffff", fontSize: 15, fontWeight: "600" },
  resultText: { color: "#eafcf3", fontSize: 14, lineHeight: 20 }
});
