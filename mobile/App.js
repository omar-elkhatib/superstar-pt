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
import { appHistoryStore } from "./src/historyStore.mjs";
import {
  buildAdaptiveRecommendation,
  computeEntryJointLoad,
  createDefaultToleranceState,
  JOINT_IDS,
  summarizeRollingLoad,
  updateToleranceFromFeedback
} from "./src/loadModel.mjs";

const READINESS_OPTIONS = ["low", "medium", "high"];
const VARIANT_OPTIONS = ["base", "seated", "supported"];

function formatJointLabel(jointId) {
  return jointId.charAt(0).toUpperCase() + jointId.slice(1);
}

function riskStyle(risk) {
  if (risk === "high") {
    return { backgroundColor: "#ffe3e3", textColor: "#8f1b1b" };
  }
  if (risk === "moderate") {
    return { backgroundColor: "#fff6df", textColor: "#8a5d00" };
  }
  return { backgroundColor: "#e4f7ec", textColor: "#1e5f3e" };
}

export default function App() {
  const [activeView, setActiveView] = useState("checkin");
  const [currentPain, setCurrentPain] = useState("4");
  const [priorPain, setPriorPain] = useState("2");
  const [readiness, setReadiness] = useState("medium");
  const [symptomWorsenedIn24h, setSymptomWorsenedIn24h] = useState(false);

  const [entries, setEntries] = useState(() => appHistoryStore.getEntries());
  const [templates] = useState(() => appHistoryStore.getTemplates());
  const [toleranceState, setToleranceState] = useState(() => {
    return appHistoryStore.getToleranceState() || createDefaultToleranceState();
  });

  const [templateId, setTemplateId] = useState(templates[0]?.id || "walking");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [effortScore, setEffortScore] = useState("4");
  const [variant, setVariant] = useState("base");
  const [feedbackJoint, setFeedbackJoint] = useState("none");
  const [feedbackScore, setFeedbackScore] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [entryError, setEntryError] = useState("");

  const loadSummary = useMemo(() => {
    return summarizeRollingLoad({
      entries,
      templates,
      toleranceState,
      asOfIso: new Date().toISOString(),
      windowDays: 14,
      acuteDays: 3
    });
  }, [entries, templates, toleranceState]);

  const baseRecommendation = useMemo(
    () =>
      adaptSession({
        currentPain: Number(currentPain) || 0,
        priorPain: Number(priorPain) || 0,
        readiness,
        symptomWorsenedIn24h
      }),
    [currentPain, priorPain, readiness, symptomWorsenedIn24h]
  );

  const recommendation = useMemo(() => {
    return buildAdaptiveRecommendation({
      baseRecommendation,
      loadSummary
    });
  }, [baseRecommendation, loadSummary]);

  const templateById = useMemo(() => {
    return new Map(templates.map((template) => [template.id, template]));
  }, [templates]);

  function handleAddEntry() {
    const duration = Number(durationMinutes);
    const effort = Number(effortScore);

    if (!templateId) {
      setEntryError("Select an exercise template.");
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setEntryError("Duration must be a positive number.");
      return;
    }

    if (!Number.isFinite(effort) || effort < 1 || effort > 10) {
      setEntryError("Effort score must be between 1 and 10.");
      return;
    }

    if (feedbackJoint !== "none") {
      const score = Number(feedbackScore);
      if (!Number.isFinite(score) || score < 0 || score > 10) {
        setEntryError("Joint discomfort must be between 0 and 10.");
        return;
      }
    }

    const nowIso = new Date().toISOString();
    const nextEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      templateId,
      performedAtIso: nowIso,
      durationMinutes: duration,
      effortScore: effort,
      variant,
      jointFeedback:
        feedbackJoint === "none"
          ? undefined
          : { [feedbackJoint]: Number(feedbackScore) }
    };

    const updatedEntries = appHistoryStore.addEntry(nextEntry);
    const updatedTolerance = updateToleranceFromFeedback({
      toleranceState,
      entries: updatedEntries,
      asOfIso: nowIso
    });

    appHistoryStore.setToleranceState(updatedTolerance);

    setEntries(updatedEntries);
    setToleranceState(updatedTolerance);
    setEntryError("");
    setFeedbackScore("");
  }

  const topJointText = loadSummary.topStressedJoints
    .map((joint) => `${formatJointLabel(joint.jointId)} (${joint.risk})`)
    .join(", ");

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView testID="main-scroll" contentContainerStyle={styles.container}>
        <Text testID="screen-home-title" style={styles.title}>
          Superstar PT
        </Text>
        <Text style={styles.subtitle}>Adaptive daily training check-in + load intelligence</Text>

        <View style={styles.viewToggleRow}>
          <Pressable
            testID="btn-view-checkin"
            onPress={() => setActiveView("checkin")}
            style={[
              styles.viewToggle,
              activeView === "checkin" ? styles.viewToggleActive : styles.viewToggleInactive
            ]}
          >
            <Text
              style={[
                styles.viewToggleText,
                activeView === "checkin" ? styles.viewToggleTextActive : styles.viewToggleTextInactive
              ]}
            >
              Check-In
            </Text>
          </Pressable>
          <Pressable
            testID="btn-view-load-map"
            onPress={() => setActiveView("load")}
            style={[
              styles.viewToggle,
              activeView === "load" ? styles.viewToggleActive : styles.viewToggleInactive
            ]}
          >
            <Text
              style={[
                styles.viewToggleText,
                activeView === "load" ? styles.viewToggleTextActive : styles.viewToggleTextInactive
              ]}
            >
              Load Map
            </Text>
          </Pressable>
        </View>

        {activeView === "checkin" ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Current pain (0-10)</Text>
              <TextInput
                testID="input-current-pain"
                value={currentPain}
                onChangeText={setCurrentPain}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={styles.label}>Prior pain (0-10)</Text>
              <TextInput
                testID="input-prior-pain"
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
                    testID={`btn-readiness-${option}`}
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
                  testID="switch-symptom-worsened"
                  value={symptomWorsenedIn24h}
                  onValueChange={setSymptomWorsenedIn24h}
                />
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Today&apos;s recommendation</Text>
              <Text testID="result-action-label" style={styles.resultItem}>
                Action: {recommendation.action}
              </Text>
              <Text style={styles.resultItem}>
                Intensity: x{recommendation.intensityMultiplier}
              </Text>
              <Text style={styles.resultText}>{recommendation.recommendation}</Text>
              {recommendation.overrideApplied ? (
                <Text testID="joint-risk-override-note" style={styles.overrideNote}>
                  Joint-load override applied due to elevated risk.
                </Text>
              ) : null}
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Quick Add Session</Text>

              <Text style={styles.label}>Exercise template</Text>
              <View style={styles.wrapRow}>
                {templates.map((template) => (
                  <Pressable
                    key={template.id}
                    testID={`btn-template-${template.id}`}
                    onPress={() => setTemplateId(template.id)}
                    style={[
                      styles.pill,
                      templateId === template.id ? styles.pillActive : styles.pillInactive
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        templateId === template.id
                          ? styles.pillTextActive
                          : styles.pillTextInactive
                      ]}
                    >
                      {template.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Variant</Text>
              <View style={styles.row}>
                {VARIANT_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    testID={`btn-variant-${option}`}
                    onPress={() => setVariant(option)}
                    style={[
                      styles.pill,
                      variant === option ? styles.pillActive : styles.pillInactive
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        variant === option
                          ? styles.pillTextActive
                          : styles.pillTextInactive
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                testID="input-duration-minutes"
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={styles.label}>Effort (1-10)</Text>
              <TextInput
                testID="input-effort-score"
                value={effortScore}
                onChangeText={setEffortScore}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={styles.label}>Optional joint discomfort feedback</Text>
              <View style={styles.wrapRow}>
                <Pressable
                  onPress={() => setFeedbackJoint("none")}
                  style={[
                    styles.pill,
                    feedbackJoint === "none" ? styles.pillActive : styles.pillInactive
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      feedbackJoint === "none"
                        ? styles.pillTextActive
                        : styles.pillTextInactive
                    ]}
                  >
                    none
                  </Text>
                </Pressable>
                {JOINT_IDS.map((jointId) => (
                  <Pressable
                    key={jointId}
                    onPress={() => setFeedbackJoint(jointId)}
                    style={[
                      styles.pill,
                      feedbackJoint === jointId ? styles.pillActive : styles.pillInactive
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        feedbackJoint === jointId
                          ? styles.pillTextActive
                          : styles.pillTextInactive
                      ]}
                    >
                      {jointId}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {feedbackJoint !== "none" ? (
                <TextInput
                  testID="input-joint-feedback"
                  value={feedbackScore}
                  onChangeText={setFeedbackScore}
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholder="Discomfort 0-10"
                  placeholderTextColor="#678475"
                />
              ) : null}

              {entryError ? <Text style={styles.errorText}>{entryError}</Text> : null}

              <Pressable testID="btn-add-session" style={styles.addButton} onPress={handleAddEntry}>
                <Text style={styles.addButtonText}>Add session</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Joint Load Summary (14d)</Text>
              <View style={styles.jointGrid}>
                {JOINT_IDS.map((jointId) => {
                  const joint = loadSummary.byJoint[jointId];
                  const color = riskStyle(joint.risk);
                  return (
                    <View
                      key={jointId}
                      testID={`joint-cell-${jointId}`}
                      style={[styles.jointCell, { backgroundColor: color.backgroundColor }]}
                    >
                      <Text style={[styles.jointCellTitle, { color: color.textColor }]}>
                        {formatJointLabel(jointId)}
                      </Text>
                      <Text style={[styles.jointCellText, { color: color.textColor }]}>Risk: {joint.risk}</Text>
                      <Text style={[styles.jointCellText, { color: color.textColor }]}>Acute: {joint.acuteLoad}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Caution + Guidance</Text>
              <Text style={styles.resultItem}>Overall risk: {loadSummary.overallRisk}</Text>
              <Text style={styles.resultText}>Top stressed joints: {topJointText || "N/A"}</Text>
              <Text style={styles.resultText}>Total load (14d): {loadSummary.totalBodyLoad}</Text>
            </View>

            <Pressable
              testID="btn-toggle-history"
              onPress={() => setShowHistory((value) => !value)}
              style={styles.historyToggle}
            >
              <Text style={styles.historyToggleText}>
                {showHistory ? "Hide" : "Show more"} history
              </Text>
            </Pressable>

            {showHistory ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Exercise History</Text>
                {entries.length === 0 ? <Text style={styles.resultText}>No sessions added yet.</Text> : null}
                {entries.map((entry) => {
                  const template = templateById.get(entry.templateId);
                  const computed = computeEntryJointLoad(entry, template);
                  return (
                    <View key={entry.id} style={styles.historyRow}>
                      <Text style={styles.historyTitle}>{template?.name || entry.templateId}</Text>
                      <Text style={styles.historyText}>
                        {new Date(entry.performedAtIso).toLocaleString()} · {entry.durationMinutes} min · effort {entry.effortScore} · {entry.variant}
                      </Text>
                      <Text style={styles.historyText}>
                        Highest joint load: {
                          [...JOINT_IDS]
                            .sort((a, b) => computed.byJoint[b] - computed.byJoint[a])[0]
                        }
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
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
  viewToggleRow: { flexDirection: "row", gap: 8 },
  viewToggle: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  viewToggleActive: { backgroundColor: "#0f6b47" },
  viewToggleInactive: { backgroundColor: "#deebe3" },
  viewToggleText: { fontSize: 14, fontWeight: "700" },
  viewToggleTextActive: { color: "#ffffff" },
  viewToggleTextInactive: { color: "#1d4c38" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 12
  },
  sectionTitle: { fontSize: 18, color: "#0d3b2a", fontWeight: "700" },
  label: { fontSize: 14, color: "#1a3d30", fontWeight: "600" },
  input: {
    backgroundColor: "#f4f7f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0d3b2a"
  },
  row: { flexDirection: "row", gap: 8 },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  resultText: { color: "#eafcf3", fontSize: 14, lineHeight: 20 },
  overrideNote: { color: "#ffe3a3", fontSize: 13, fontWeight: "700" },
  errorText: { color: "#962e2e", fontSize: 13, fontWeight: "600" },
  addButton: {
    backgroundColor: "#0f6b47",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  addButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  jointGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  jointCell: {
    borderRadius: 12,
    padding: 10,
    width: "48%",
    gap: 2
  },
  jointCellTitle: { fontWeight: "700", fontSize: 14 },
  jointCellText: { fontSize: 12, fontWeight: "600" },
  historyToggle: {
    alignSelf: "flex-start",
    backgroundColor: "#deebe3",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  historyToggleText: { color: "#1d4c38", fontWeight: "700" },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: "#d5e7de",
    paddingTop: 8,
    gap: 2
  },
  historyTitle: { fontSize: 15, fontWeight: "700", color: "#173b2e" },
  historyText: { fontSize: 13, color: "#2c5b48" }
});
