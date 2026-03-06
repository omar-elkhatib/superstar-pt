import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { TopFeedbackBanner } from "./src/TopFeedbackBanner";
import { adaptSession } from "./src/adaptivePlan.mjs";
import { resolveFeedbackEvent } from "./src/feedbackPolicy.mjs";
import { triggerHaptic } from "./src/hapticsClient.mjs";
import { appHistoryStore } from "./src/historyStore.mjs";
import {
  buildDailyLoadSeries,
  buildDailyRiskGuideFromSummary,
  buildRiskCategoryLegend,
  buildUnifiedLoadChart,
  buildAdaptiveRecommendation,
  computeEntryJointLoad,
  createDefaultToleranceState,
  JOINT_IDS,
  selectTopJointSeries,
  summarizeRollingLoad,
  updateToleranceFromFeedback
} from "./src/loadModel.mjs";

const READINESS_OPTIONS = ["low", "medium", "high"];
const VARIANT_OPTIONS = ["base", "seated", "supported"];
const LOAD_WINDOW_DAYS = 14;
const JOINT_SERIES_COLORS = {
  ankle: "#2d77d1",
  knee: "#0f8d69",
  hip: "#e07a2f",
  spine: "#8a4fbf",
  neck: "#d83a7c",
  shoulder: "#2097a8",
  elbow: "#9a7a2e",
  wrist: "#4f5a77"
};
const UNIFIED_CHART_HEIGHT = 148;

function formatJointLabel(jointId) {
  return jointId.charAt(0).toUpperCase() + jointId.slice(1);
}

function formatDayLabel(dayKey) {
  const [year, month, day] = dayKey.split("-");
  if (!year || !month || !day) {
    return dayKey;
  }
  return `${month}/${day}`;
}

function shouldRenderDayTick(index, totalDays) {
  if (totalDays <= 7) {
    return true;
  }
  const interval = Math.ceil(totalDays / 6);
  return index === 0 || index === totalDays - 1 || index % interval === 0;
}

function toScaledBarHeight(value, max, maxHeight) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || value <= 0 || max <= 0) {
    return 0;
  }
  return Math.max(2, Math.round((value / max) * maxHeight));
}

function toScaledAxisOffset(value, max, maxHeight) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || value <= 0 || max <= 0) {
    return 0;
  }
  return Math.round((value / max) * maxHeight);
}

function formatLoadValue(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }
  if (value >= 100) {
    return `${Math.round(value)}`;
  }
  return value.toFixed(1);
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
  const [showAllJointSeries, setShowAllJointSeries] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState(null);
  const feedbackTimerRef = useRef(null);

  const loadSummary = useMemo(() => {
    return summarizeRollingLoad({
      entries,
      templates,
      toleranceState,
      asOfIso: new Date().toISOString(),
      windowDays: LOAD_WINDOW_DAYS,
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

  const dailyLoadSeries = useMemo(() => {
    return buildDailyLoadSeries({
      entries,
      templates,
      asOfIso: new Date().toISOString()
    });
  }, [entries, templates]);

  const topJointSeries = useMemo(() => {
    return selectTopJointSeries({
      days: dailyLoadSeries.days,
      jointIds: JOINT_IDS,
      count: 4
    });
  }, [dailyLoadSeries]);

  const visibleJointSeries = showAllJointSeries ? JOINT_IDS : topJointSeries;
  const riskGuide = useMemo(() => {
    return buildDailyRiskGuideFromSummary({
      loadSummary,
      jointIds: visibleJointSeries,
      windowDays: LOAD_WINDOW_DAYS
    });
  }, [loadSummary, visibleJointSeries]);
  const riskLegend = useMemo(() => {
    return buildRiskCategoryLegend({ riskGuide });
  }, [riskGuide]);

  const unifiedLoadChart = useMemo(() => {
    return buildUnifiedLoadChart({
      days: dailyLoadSeries.days,
      jointIds: visibleJointSeries
    });
  }, [dailyLoadSeries, visibleJointSeries]);

  const rawChartAxisMax = Math.max(
    unifiedLoadChart.maxValue,
    Number(riskGuide?.highDailyThreshold || 0)
  );
  const chartAxisMax = rawChartAxisMax > 0 ? rawChartAxisMax * 1.1 : 1;
  const dayTrackWidth = Math.max(72, unifiedLoadChart.seriesKeys.length * 18 + 24);

  const templateById = useMemo(() => {
    return new Map(templates.map((template) => [template.id, template]));
  }, [templates]);

  function clearFeedbackTimer() {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      clearFeedbackTimer();
    };
  }, []);

  function showFeedbackBanner(banner) {
    if (!banner) {
      return;
    }

    clearFeedbackTimer();
    setFeedbackNotice({
      kind: banner.kind,
      message: banner.message,
      ttlMs: banner.ttlMs
    });

    feedbackTimerRef.current = setTimeout(() => {
      setFeedbackNotice(null);
      feedbackTimerRef.current = null;
    }, banner.ttlMs);
  }

  function emitFeedback(event) {
    const feedback = resolveFeedbackEvent(event);
    if (feedback.hapticKind) {
      void triggerHaptic(feedback.hapticKind);
    }
    if (feedback.banner) {
      showFeedbackBanner(feedback.banner);
    }
  }

  function handleViewChange(nextView) {
    if (nextView === activeView) {
      return;
    }

    const previousView = activeView;
    setActiveView(nextView);
    emitFeedback({
      type: "view_change",
      from: previousView,
      to: nextView
    });
  }

  function handleAddEntry() {
    const duration = Number(durationMinutes);
    const effort = Number(effortScore);
    const emitValidationError = (message) => {
      setEntryError(message);
      emitFeedback({
        type: "session_validation_error",
        message
      });
    };

    if (!templateId) {
      emitValidationError("Select an exercise template.");
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      emitValidationError("Duration must be a positive number.");
      return;
    }

    if (!Number.isFinite(effort) || effort < 1 || effort > 10) {
      emitValidationError("Effort score must be between 1 and 10.");
      return;
    }

    if (feedbackJoint !== "none") {
      const score = Number(feedbackScore);
      if (!Number.isFinite(score) || score < 0 || score > 10) {
        emitValidationError("Joint discomfort must be between 0 and 10.");
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
    emitFeedback({
      type: "session_added",
      templateId
    });
  }

  const topJointText = loadSummary.topStressedJoints
    .map((joint) => `${formatJointLabel(joint.jointId)} (${joint.risk})`)
    .join(", ");

  const chartRangeText =
    dailyLoadSeries.days.length > 0
      ? `${formatDayLabel(dailyLoadSeries.days[0].dayKey)} - ${formatDayLabel(
          dailyLoadSeries.days[dailyLoadSeries.days.length - 1].dayKey
        )} (${dailyLoadSeries.days.length} days)`
      : "No tracking data yet";

  const loadVisualizationCard = (
    <View style={styles.card}>
      <View style={styles.loadChartHeaderRow}>
        <Text style={styles.sectionTitle}>Load Over Time</Text>
        <Pressable
          testID="btn-toggle-joint-series"
          onPress={() => setShowAllJointSeries((value) => !value)}
          style={styles.chartToggleButton}
        >
          <Text style={styles.chartToggleButtonText}>
            {showAllJointSeries ? "Show top joints" : "Show all joints"}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.loadChartSubText}>Tracking period: {chartRangeText}</Text>

      {dailyLoadSeries.days.length === 0 ? (
        <Text style={styles.chartEmptyText}>Add sessions to unlock daily load trends.</Text>
      ) : (
        <>
          <View style={styles.seriesLegendRow}>
            <View style={styles.seriesLegendItem}>
              <View style={[styles.seriesLegendDot, { backgroundColor: "#0f6b47" }]} />
              <Text style={styles.seriesLegendText}>Total</Text>
            </View>
            {visibleJointSeries.map((jointId) => (
              <View key={`legend-${jointId}`} style={styles.seriesLegendItem}>
                <View
                  style={[
                    styles.seriesLegendDot,
                    { backgroundColor: JOINT_SERIES_COLORS[jointId] || "#7ca08f" }
                  ]}
                />
                <Text style={styles.seriesLegendText}>{formatJointLabel(jointId)}</Text>
              </View>
            ))}
          </View>

          {riskGuide ? (
            <Text style={styles.riskGuideText}>
              Risk guides ({formatJointLabel(riskGuide.referenceJointId)}): moderate{" "}
              {formatLoadValue(riskGuide.moderateDailyThreshold)} / high{" "}
              {formatLoadValue(riskGuide.highDailyThreshold)}
            </Text>
          ) : (
            <Text style={styles.riskGuideText}>Risk guides will appear after enough load history.</Text>
          )}

          <View style={styles.riskCategoryLegendRow}>
            {riskLegend.map((item) => (
              <View key={`risk-${item.category}`} style={styles.riskCategoryLegendItem}>
                {item.category === "low" ? (
                  <View
                    style={[
                      styles.riskCategorySolidSwatch,
                      { backgroundColor: item.color }
                    ]}
                  />
                ) : (
                  <View style={styles.riskCategoryDashSwatch}>
                    {Array.from({ length: 4 }).map((_, dashIndex) => (
                      <View
                        key={`${item.category}-dash-${dashIndex}`}
                        style={[styles.riskCategoryDash, { backgroundColor: item.color }]}
                      />
                    ))}
                  </View>
                )}
                <Text testID={`risk-category-${item.category}`} style={styles.riskCategoryLegendText}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.chartBlock}>
            <Text style={styles.chartBlockTitle}>Daily load comparison (shared axis)</Text>
            <View testID="chart-shared-axis" style={styles.unifiedChartFrame}>
              <View style={styles.unifiedAxisColumn}>
                <Text style={styles.unifiedAxisLabel}>
                  {formatLoadValue(chartAxisMax)}
                </Text>
                <Text style={styles.unifiedAxisLabel}>0</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.unifiedChartScrollContent}>
                  {unifiedLoadChart.days.map((day, index) => {
                    const showTick = shouldRenderDayTick(index, unifiedLoadChart.days.length);
                    return (
                      <View key={`group-${day.dayKey}`} style={styles.unifiedDayGroup}>
                        <View style={[styles.unifiedDayBarsTrack, { width: dayTrackWidth }]}>
                          {unifiedLoadChart.seriesKeys.map((seriesKey) => {
                            const value = Number(day.values?.[seriesKey] || 0);
                            const barHeight = toScaledBarHeight(
                              value,
                              chartAxisMax,
                              UNIFIED_CHART_HEIGHT
                            );
                            const backgroundColor =
                              seriesKey === "total"
                                ? "#0f6b47"
                                : JOINT_SERIES_COLORS[seriesKey] || "#7ca08f";

                            return (
                              <View key={`${seriesKey}-${day.dayKey}`} style={styles.unifiedSeriesColumn}>
                                {value > 0 ? (
                                  <Text style={styles.unifiedSeriesValueTag}>
                                    {formatLoadValue(value)}
                                  </Text>
                                ) : (
                                  <View style={styles.unifiedSeriesValueSpacer} />
                                )}
                                <View
                                  style={[
                                    styles.unifiedSeriesBar,
                                    {
                                      height: barHeight,
                                      backgroundColor
                                    }
                                  ]}
                                />
                              </View>
                            );
                          })}
                          {riskGuide ? (
                            <>
                              <View
                                style={[
                                  styles.unifiedRiskDashRow,
                                  {
                                    bottom: Math.max(
                                      14,
                                      toScaledAxisOffset(
                                        riskGuide.highDailyThreshold,
                                        chartAxisMax,
                                        UNIFIED_CHART_HEIGHT
                                      )
                                    )
                                  }
                                ]}
                              >
                                {Array.from({ length: 12 }).map((_, dashIndex) => (
                                  <View
                                    key={`high-${day.dayKey}-${dashIndex}`}
                                    style={[styles.unifiedRiskDash, { backgroundColor: "#b83737" }]}
                                  />
                                ))}
                              </View>
                              <View
                                style={[
                                  styles.unifiedRiskDashRow,
                                  {
                                    bottom: Math.max(
                                      8,
                                      toScaledAxisOffset(
                                        riskGuide.moderateDailyThreshold,
                                        chartAxisMax,
                                        UNIFIED_CHART_HEIGHT
                                      )
                                    )
                                  }
                                ]}
                              >
                                {Array.from({ length: 12 }).map((_, dashIndex) => (
                                  <View
                                    key={`moderate-${day.dayKey}-${dashIndex}`}
                                    style={[styles.unifiedRiskDash, { backgroundColor: "#c99335" }]}
                                  />
                                ))}
                              </View>
                            </>
                          ) : null}
                        </View>
                        <Text style={styles.unifiedDayLabel}>
                          {showTick ? formatDayLabel(day.dayKey) : ""}
                        </Text>
                        <Text style={styles.unifiedDayTotalLabel}>
                          T {formatLoadValue(day.values.total)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>

          <Text testID="hint-risk-categories" style={styles.sharedAxisHint}>
            Risk guides map to Low, Medium, and High categories. Values above bars show exact daily load.
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView testID="main-scroll" contentContainerStyle={styles.container}>
        <TopFeedbackBanner notice={feedbackNotice} />
        <Text testID="screen-home-title" style={styles.title}>
          Superstar PT
        </Text>
        <Text style={styles.subtitle}>Adaptive daily training check-in + load intelligence</Text>

        <View style={styles.viewToggleRow}>
          <Pressable
            testID="btn-view-checkin"
            onPress={() => handleViewChange("checkin")}
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
            onPress={() => handleViewChange("load")}
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
          <Pressable
            testID="btn-view-visualization"
            onPress={() => handleViewChange("visualization")}
            style={[
              styles.viewToggle,
              activeView === "visualization" ? styles.viewToggleActive : styles.viewToggleInactive
            ]}
          >
            <Text
              style={[
                styles.viewToggleText,
                activeView === "visualization"
                  ? styles.viewToggleTextActive
                  : styles.viewToggleTextInactive
              ]}
            >
              Visualization
            </Text>
          </Pressable>
        </View>

        {activeView === "checkin" ? (
          <>
            <View testID="card-load-over-time" style={styles.card}>
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
        ) : activeView === "load" ? (
          <>
            <View style={styles.card}>
              <View style={styles.quickAddHeaderRow}>
                <Text style={styles.sectionTitle}>Quick Add Session</Text>
                <Pressable testID="btn-add-session" style={styles.quickAddButton} onPress={handleAddEntry}>
                  <Text style={styles.quickAddButtonText}>Add session</Text>
                </Pressable>
              </View>

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

              <Pressable style={styles.addButton} onPress={handleAddEntry}>
                <Text style={styles.addButtonText}>Add session</Text>
              </Pressable>
            </View>

            <Pressable
              testID="btn-open-visualization"
              onPress={() => handleViewChange("visualization")}
              style={styles.visualizationShortcut}
            >
              <Text style={styles.visualizationShortcutText}>Open joint-load visualization</Text>
            </Pressable>

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
        ) : (
          <View testID="view-joint-load-visualization" style={styles.visualizationView}>
            {loadVisualizationCard}
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Caution + Guidance</Text>
              <Text style={styles.resultItem}>Overall risk: {loadSummary.overallRisk}</Text>
              <Text style={styles.resultText}>Top stressed joints: {topJointText || "N/A"}</Text>
              <Text style={styles.resultText}>Total load (14d): {loadSummary.totalBodyLoad}</Text>
            </View>
          </View>
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
  viewToggleRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
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
  visualizationView: { gap: 18 },
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
  quickAddHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  quickAddButton: {
    backgroundColor: "#0f6b47",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  quickAddButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 12 },
  addButton: {
    backgroundColor: "#0f6b47",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  addButtonText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  visualizationShortcut: {
    alignSelf: "flex-start",
    backgroundColor: "#deebe3",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  visualizationShortcutText: { color: "#1d4c38", fontWeight: "700" },
  loadChartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  chartToggleButton: {
    backgroundColor: "#deebe3",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  chartToggleButtonText: { color: "#1d4c38", fontWeight: "700", fontSize: 12 },
  loadChartSubText: { fontSize: 13, color: "#2f6650", fontWeight: "600" },
  chartEmptyText: { fontSize: 14, color: "#32614d" },
  riskGuideText: { fontSize: 12, color: "#355f4d", lineHeight: 17, fontWeight: "600" },
  riskCategoryLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  riskCategoryLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  riskCategorySolidSwatch: {
    width: 16,
    height: 2,
    borderRadius: 999
  },
  riskCategoryDashSwatch: {
    flexDirection: "row",
    gap: 2
  },
  riskCategoryDash: {
    width: 4,
    height: 2,
    borderRadius: 999
  },
  riskCategoryLegendText: { fontSize: 11, color: "#486f5f", fontWeight: "700" },
  chartBlock: { gap: 8 },
  chartBlockTitle: { fontSize: 15, color: "#173b2e", fontWeight: "700" },
  seriesLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  seriesLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#edf4f0",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  seriesLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 999
  },
  seriesLegendText: { fontSize: 12, color: "#214d3b", fontWeight: "600" },
  unifiedChartFrame: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8
  },
  unifiedAxisColumn: {
    height: UNIFIED_CHART_HEIGHT + 14,
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  unifiedAxisLabel: { fontSize: 11, color: "#466d5d", fontWeight: "700", minWidth: 28 },
  unifiedChartScrollContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingRight: 8
  },
  unifiedDayGroup: {
    alignItems: "center",
    gap: 4
  },
  unifiedDayBarsTrack: {
    height: UNIFIED_CHART_HEIGHT,
    paddingHorizontal: 4,
    paddingBottom: 4,
    paddingTop: 4,
    gap: 4,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 8,
    backgroundColor: "#edf4f0",
    overflow: "visible",
    position: "relative"
  },
  unifiedRiskDashRow: {
    position: "absolute",
    left: 4,
    right: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 3
  },
  unifiedRiskDash: {
    width: 5,
    height: 2,
    borderRadius: 999
  },
  unifiedSeriesColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2
  },
  unifiedSeriesValueTag: {
    fontSize: 8,
    color: "#3c6454",
    fontWeight: "700",
    lineHeight: 10,
    minHeight: 10
  },
  unifiedSeriesValueSpacer: {
    minHeight: 10
  },
  unifiedSeriesBar: {
    width: 10,
    borderRadius: 6
  },
  unifiedDayLabel: { fontSize: 10, color: "#5f7f72", fontWeight: "600", minHeight: 12 },
  unifiedDayTotalLabel: { fontSize: 9, color: "#35624e", fontWeight: "700", minHeight: 11 },
  sharedAxisHint: { fontSize: 12, color: "#3e6556", lineHeight: 17 },
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
