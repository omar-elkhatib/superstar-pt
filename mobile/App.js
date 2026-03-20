import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { TopFeedbackBanner } from "./src/TopFeedbackBanner";
import { adaptSession } from "./src/adaptivePlan.mjs";
import {
  buildDailyRecommendationInput,
  resolveTodaysCheckIn,
  selectDailyHomeState
} from "./src/checkInModel.mjs";
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
  rebuildToleranceStateFromEntries,
  selectTopJointSeries,
  summarizeRollingLoad,
  updateToleranceFromFeedback
} from "./src/loadModel.mjs";
import {
  deleteSessionById,
  resolveSelectedSessionId
} from "./src/sessionBrowser.mjs";
import {
  computeKeyboardAwareScrollOffset,
  computeRevealScrollOffset
} from "./src/scrollBehavior.mjs";

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

function formatPerformedAt(performedAtIso) {
  const performedAt = Date.parse(performedAtIso);
  if (!Number.isFinite(performedAt)) {
    return "Unknown time";
  }

  return new Date(performedAtIso).toLocaleString();
}

function formatJointFeedback(jointFeedback) {
  if (!jointFeedback || Object.keys(jointFeedback).length === 0) {
    return "No joint discomfort recorded.";
  }

  return Object.entries(jointFeedback)
    .map(([jointId, score]) => `${formatJointLabel(jointId)} ${score}/10`)
    .join(", ");
}

function findHighestLoadJoint(computed) {
  if (!computed?.byJoint) {
    return null;
  }

  return [...JOINT_IDS].sort((a, b) => computed.byJoint[b] - computed.byJoint[a])[0] || null;
}

function formatTopJointLoads(computed) {
  if (!computed?.byJoint) {
    return "No load details available.";
  }

  const topLoads = [...JOINT_IDS]
    .map((jointId) => ({
      jointId,
      value: Number(computed.byJoint[jointId] || 0)
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  if (topLoads.length === 0) {
    return "No load details available.";
  }

  return topLoads
    .map((item) => `${formatJointLabel(item.jointId)} ${formatLoadValue(item.value)}`)
    .join(" · ");
}

export default function App() {
  const [activeView, setActiveView] = useState("main");
  const [sessionPainScore, setSessionPainScore] = useState("4");
  const [checkIns, setCheckIns] = useState(() => appHistoryStore.getCheckIns());
  const [isCheckInEditorOpen, setIsCheckInEditorOpen] = useState(false);
  const [checkInPainScore, setCheckInPainScore] = useState("4");
  const [checkInReadinessScore, setCheckInReadinessScore] = useState("6");
  const [checkInFatigueScore, setCheckInFatigueScore] = useState("3");
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInError, setCheckInError] = useState("");

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
  const [selectedSessionId, setSelectedSessionId] = useState(() => {
    return resolveSelectedSessionId({
      entries,
      selectedSessionId: null
    });
  });
  const [showAllJointSeries, setShowAllJointSeries] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const feedbackTimerRef = useRef(null);
  const scrollViewRef = useRef(null);
  const layoutRegistryRef = useRef({});
  const focusedFieldKeyRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const keyboardHeightRef = useRef(0);

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

  const currentNowIso = new Date().toISOString();
  const todaysCheckIn = useMemo(() => {
    return resolveTodaysCheckIn({
      checkIns,
      nowIso: currentNowIso
    });
  }, [checkIns, currentNowIso]);
  const dailyHomeState = useMemo(() => {
    return selectDailyHomeState({
      checkIns,
      nowIso: currentNowIso
    });
  }, [checkIns, currentNowIso]);
  const dailyRecommendationInput = useMemo(() => {
    return buildDailyRecommendationInput({
      checkIns,
      nowIso: currentNowIso
    });
  }, [checkIns, currentNowIso]);

  const baseRecommendation = useMemo(
    () =>
      adaptSession({
        currentPain: dailyRecommendationInput?.currentPain ?? Number(sessionPainScore) ?? 0,
        priorPain: dailyRecommendationInput?.priorPain ?? Number(sessionPainScore) ?? 0,
        readiness: dailyRecommendationInput?.readiness ?? "medium",
        symptomWorsenedIn24h: dailyRecommendationInput?.symptomWorsenedIn24h ?? false
      }),
    [dailyRecommendationInput, sessionPainScore]
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

  const resolvedSelectedSessionId = useMemo(() => {
    return resolveSelectedSessionId({
      entries,
      selectedSessionId
    });
  }, [entries, selectedSessionId]);

  const rawChartAxisMax = Math.max(
    unifiedLoadChart.maxValue,
    Number(riskGuide?.highDailyThreshold || 0)
  );
  const chartAxisMax = rawChartAxisMax > 0 ? rawChartAxisMax * 1.1 : 1;
  const dayTrackWidth = Math.max(72, unifiedLoadChart.seriesKeys.length * 18 + 24);

  const templateById = useMemo(() => {
    return new Map(templates.map((template) => [template.id, template]));
  }, [templates]);

  const selectedSession = useMemo(() => {
    return entries.find((entry) => entry.id === resolvedSelectedSessionId) || null;
  }, [entries, resolvedSelectedSessionId]);

  const selectedSessionTemplate = useMemo(() => {
    if (!selectedSession) {
      return null;
    }

    return templateById.get(selectedSession.templateId) || null;
  }, [selectedSession, templateById]);

  const selectedSessionLoad = useMemo(() => {
    if (!selectedSession || !selectedSessionTemplate) {
      return null;
    }

    return computeEntryJointLoad(selectedSession, selectedSessionTemplate);
  }, [selectedSession, selectedSessionTemplate]);

  const selectedSessionHighestJoint = useMemo(() => {
    return findHighestLoadJoint(selectedSessionLoad);
  }, [selectedSessionLoad]);

  const selectedSessionLoadSummary = useMemo(() => {
    return formatTopJointLoads(selectedSessionLoad);
  }, [selectedSessionLoad]);

  function captureLayout(layoutKey, parentKey = null) {
    return (event) => {
      const { y, height } = event.nativeEvent.layout;
      const parentY = parentKey ? Number(layoutRegistryRef.current[parentKey]?.y || 0) : 0;
      layoutRegistryRef.current[layoutKey] = {
        y: parentY + y,
        height
      };
    };
  }

  function scrollToLayout(
    layoutKey,
    {
      reason = "reveal",
      keyboardHeightOverride = keyboardHeightRef.current,
      topMargin = 16,
      gap = 12
    } = {}
  ) {
    const layout = layoutRegistryRef.current[layoutKey];
    if (!layout || !scrollViewRef.current) {
      return;
    }

    const nextOffset =
      reason === "keyboard" && viewportHeightRef.current > 0
        ? computeKeyboardAwareScrollOffset({
            targetY: layout.y,
            targetHeight: layout.height,
            viewportHeight: viewportHeightRef.current,
            keyboardHeight: keyboardHeightOverride,
            currentOffset: scrollOffsetRef.current,
            gap
          })
        : computeRevealScrollOffset({
            targetY: layout.y,
            topMargin
          });

    scrollViewRef.current.scrollTo({
      y: nextOffset,
      animated: true
    });
    scrollOffsetRef.current = nextOffset;
  }

  function handleInputFocus(layoutKey) {
    focusedFieldKeyRef.current = layoutKey;

    if (keyboardHeightRef.current > 0) {
      requestAnimationFrame(() => {
        scrollToLayout(layoutKey, {
          reason: "keyboard",
          keyboardHeightOverride: keyboardHeightRef.current
        });
      });
    }
  }

  function handleDeleteSelectedSession() {
    if (!resolvedSelectedSessionId) {
      return;
    }

    const nextSessionState = deleteSessionById({
      entries,
      selectedSessionId: resolvedSelectedSessionId,
      entryId: resolvedSelectedSessionId
    });
    const nextToleranceState = rebuildToleranceStateFromEntries({
      entries: nextSessionState.entries
    });

    appHistoryStore.setEntries(nextSessionState.entries);
    appHistoryStore.setToleranceState(nextToleranceState);

    setEntries(nextSessionState.entries);
    setToleranceState(nextToleranceState);
    setSelectedSessionId(nextSessionState.selectedSessionId);
  }

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

  useEffect(() => {
    if (!todaysCheckIn) {
      return;
    }

    setCheckInPainScore(String(todaysCheckIn.painScore));
    setCheckInReadinessScore(String(todaysCheckIn.readinessScore));
    setCheckInFatigueScore(String(todaysCheckIn.fatigueScore));
    setCheckInNote(todaysCheckIn.note || "");
  }, [todaysCheckIn]);

  useEffect(() => {
    if (resolvedSelectedSessionId !== selectedSessionId) {
      setSelectedSessionId(resolvedSelectedSessionId);
    }
  }, [resolvedSelectedSessionId, selectedSessionId]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleKeyboardShow = (event) => {
      const nextHeight = Math.max(0, Number(event?.endCoordinates?.height) || 0);
      keyboardHeightRef.current = nextHeight;
      setKeyboardHeight(nextHeight);

      if (focusedFieldKeyRef.current) {
        requestAnimationFrame(() => {
          scrollToLayout(focusedFieldKeyRef.current, {
            reason: "keyboard",
            keyboardHeightOverride: nextHeight
          });
        });
      }
    };
    const handleKeyboardHide = () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
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

  function openCheckInEditor() {
    if (todaysCheckIn) {
      setCheckInPainScore(String(todaysCheckIn.painScore));
      setCheckInReadinessScore(String(todaysCheckIn.readinessScore));
      setCheckInFatigueScore(String(todaysCheckIn.fatigueScore));
      setCheckInNote(todaysCheckIn.note || "");
    }

    setCheckInError("");
    setIsCheckInEditorOpen(true);

    requestAnimationFrame(() => {
      scrollToLayout("daily-checkin-card");
    });
  }

  function handleSaveDailyCheckIn() {
    const pain = Number(checkInPainScore);
    const readiness = Number(checkInReadinessScore);
    const fatigue = Number(checkInFatigueScore);
    const invalidMessage =
      !Number.isFinite(pain) || pain < 0 || pain > 10
        ? "Pain score must be between 0 and 10."
        : !Number.isFinite(readiness) || readiness < 0 || readiness > 10
          ? "Readiness score must be between 0 and 10."
          : !Number.isFinite(fatigue) || fatigue < 0 || fatigue > 10
            ? "Fatigue score must be between 0 and 10."
            : "";

    if (invalidMessage) {
      setCheckInError(invalidMessage);
      emitFeedback({
        type: "session_validation_error",
        message: invalidMessage
      });
      return;
    }

    const savedCheckIn = appHistoryStore.saveDailyCheckIn(
      {
        painScore: pain,
        readinessScore: readiness,
        fatigueScore: fatigue,
        note: checkInNote
      },
      { nowIso: new Date().toISOString() }
    );

    setCheckIns(appHistoryStore.getCheckIns());
    setCheckInPainScore(String(savedCheckIn.painScore));
    setCheckInReadinessScore(String(savedCheckIn.readinessScore));
    setCheckInFatigueScore(String(savedCheckIn.fatigueScore));
    setCheckInNote(savedCheckIn.note || "");
    setCheckInError("");
    setIsCheckInEditorOpen(false);
    setActiveView("main");
    emitFeedback({
      type: "session_added",
      templateId: "daily-checkin"
    });

    requestAnimationFrame(() => {
      scrollToLayout("recommendation-card");
    });
  }

  function handleAddEntry() {
    const pain = Number(sessionPainScore);
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

    if (!Number.isFinite(pain) || pain < 0 || pain > 10) {
      emitValidationError("Pain score must be between 0 and 10.");
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
      painScore: pain,
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
    setSelectedSessionId(nextEntry.id);
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

  const dailyCheckInCard = (
    <View
      testID="card-daily-checkin"
      style={[styles.card, styles.dailyCheckInCard]}
      onLayout={captureLayout("daily-checkin-card")}
    >
      <View style={styles.quickAddHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>
            {dailyHomeState.mode === "edit" ? "Today's Check-In" : "Start Your Day"}
          </Text>
          <Text style={styles.dailyCheckInSubtext}>
            {dailyHomeState.status === "missing"
              ? "Log pain, readiness, and fatigue before you choose today's work."
              : "Today's condition is saved and ready to drive the recommendation."}
          </Text>
        </View>
        <Pressable
          testID="btn-open-daily-checkin"
          onPress={openCheckInEditor}
          style={styles.quickAddButton}
        >
          <Text style={styles.quickAddButtonText}>{dailyHomeState.ctaLabel}</Text>
        </Pressable>
      </View>

      {dailyHomeState.status === "missing" ? (
        <View testID="daily-checkin-missing-state" style={styles.dailyPromptPanel}>
          <Text style={styles.dailyPromptTitle}>No check-in saved for today.</Text>
          <Text style={styles.dailyPromptText}>
            Start here so the app can tailor today&apos;s guidance before you add sessions.
          </Text>
        </View>
      ) : (
        <View testID="daily-checkin-summary-state" style={styles.dailySummaryPanel}>
          <Text style={styles.dailySummaryTitle}>Today&apos;s summary</Text>
          <Text testID="daily-checkin-summary-pain" style={styles.dailySummaryText}>
            {dailyHomeState.summary.painLabel}
          </Text>
          <Text testID="daily-checkin-summary-readiness" style={styles.dailySummaryText}>
            {dailyHomeState.summary.readinessLabel}
          </Text>
          <Text testID="daily-checkin-summary-fatigue" style={styles.dailySummaryText}>
            {dailyHomeState.summary.fatigueLabel}
          </Text>
          <Text style={styles.dailySummaryMeta}>
            Updated {formatPerformedAt(dailyHomeState.checkIn.updatedAtIso)}
          </Text>
          {dailyHomeState.summary.note ? (
            <Text testID="daily-checkin-summary-note" style={styles.dailySummaryNote}>
              {dailyHomeState.summary.note}
            </Text>
          ) : null}
        </View>
      )}

      {isCheckInEditorOpen ? (
        <View testID="daily-checkin-editor" style={styles.dailyEditorCard}>
          <Text testID="daily-checkin-mode-label" style={styles.dailyEditorTitle}>
            {dailyHomeState.mode === "edit" ? "Editing today's check-in" : "Create today's check-in"}
          </Text>

          <View onLayout={captureLayout("field-checkin-pain", "daily-checkin-card")}>
            <Text style={styles.label}>Pain (0-10)</Text>
            <TextInput
              testID="input-checkin-pain"
              value={checkInPainScore}
              onChangeText={setCheckInPainScore}
              onFocus={() => handleInputFocus("field-checkin-pain")}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          <View onLayout={captureLayout("field-checkin-readiness", "daily-checkin-card")}>
            <Text style={styles.label}>Readiness (0-10)</Text>
            <TextInput
              testID="input-checkin-readiness"
              value={checkInReadinessScore}
              onChangeText={setCheckInReadinessScore}
              onFocus={() => handleInputFocus("field-checkin-readiness")}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          <View onLayout={captureLayout("field-checkin-fatigue", "daily-checkin-card")}>
            <Text style={styles.label}>Fatigue (0-10)</Text>
            <TextInput
              testID="input-checkin-fatigue"
              value={checkInFatigueScore}
              onChangeText={setCheckInFatigueScore}
              onFocus={() => handleInputFocus("field-checkin-fatigue")}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          <View onLayout={captureLayout("field-checkin-note", "daily-checkin-card")}>
            <Text style={styles.label}>Optional note</Text>
            <TextInput
              testID="input-checkin-note"
              value={checkInNote}
              onChangeText={setCheckInNote}
              onFocus={() => handleInputFocus("field-checkin-note")}
              multiline
              style={[styles.input, styles.noteInput]}
              placeholder="How are you feeling this morning?"
              placeholderTextColor="#678475"
            />
          </View>

          {checkInError ? (
            <Text testID="daily-checkin-error-text" style={styles.errorText}>
              {checkInError}
            </Text>
          ) : null}

          <View style={styles.dailyEditorActionRow}>
            <Pressable
              testID="btn-save-daily-checkin"
              onPress={handleSaveDailyCheckIn}
              style={styles.quickAddButton}
            >
              <Text style={styles.quickAddButtonText}>Save today&apos;s check-in</Text>
            </Pressable>
            <Pressable
              testID="btn-cancel-daily-checkin"
              onPress={() => {
                setCheckInError("");
                setIsCheckInEditorOpen(false);
              }}
              style={styles.secondaryActionButton}
            >
              <Text style={styles.secondaryActionButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );

  const sessionBrowserCard = (
    <View testID="card-session-browser" style={styles.card}>
      <View testID="session-browser-header" style={styles.sessionBrowserHeader}>
        <Text testID="session-browser-title" style={styles.sectionTitle}>
          Session Browser
        </Text>
        <Text testID="session-browser-count" style={styles.sessionBrowserCount}>
          {entries.length} saved
        </Text>
      </View>
      {entries.length === 0 ? (
        <Text testID="session-browser-empty" style={styles.chartEmptyText}>
          No sessions added yet.
        </Text>
      ) : (
        <>
          <View style={styles.sessionList}>
            {entries.map((entry, index) => {
              const template = templateById.get(entry.templateId);
              const isSelected = entry.id === resolvedSelectedSessionId;
              const painText = Number.isFinite(Number(entry.painScore)) ? `${entry.painScore}/10` : "N/A";
              return (
                <Pressable
                  key={entry.id}
                  testID={`btn-session-row-${index}`}
                  onPress={() => setSelectedSessionId(entry.id)}
                  style={[
                    styles.sessionListItem,
                    isSelected ? styles.sessionListItemActive : styles.sessionListItemInactive
                  ]}
                >
                  <Text
                    style={[
                      styles.sessionListTitle,
                      isSelected ? styles.sessionListTitleActive : styles.sessionListTitleInactive
                    ]}
                  >
                    {template?.name || entry.templateId}
                  </Text>
                  <Text
                    style={[
                      styles.sessionListMeta,
                      isSelected ? styles.sessionListMetaActive : styles.sessionListMetaInactive
                    ]}
                  >
                    {formatPerformedAt(entry.performedAtIso)} · {entry.durationMinutes} min · effort{" "}
                    {entry.effortScore} · pain {painText}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedSession ? (
            <View testID="session-detail-card" style={styles.sessionDetailCard}>
              <View style={styles.sessionDetailHeaderRow}>
                <View style={styles.sessionDetailHeaderText}>
                  <Text testID="session-detail-title" style={styles.sessionDetailTitle}>
                    {selectedSessionTemplate?.name || selectedSession.templateId}
                  </Text>
                  <Text style={styles.sessionDetailSubtitle}>Selected session</Text>
                </View>
                <Pressable
                  testID="btn-delete-selected-session"
                  onPress={handleDeleteSelectedSession}
                  style={styles.deleteSessionButton}
                >
                  <Text style={styles.deleteSessionButtonText}>Delete</Text>
                </Pressable>
              </View>

              <Text style={styles.sessionDetailLabel}>Performed</Text>
              <Text style={styles.sessionDetailValue}>
                {formatPerformedAt(selectedSession.performedAtIso)}
              </Text>

              <Text style={styles.sessionDetailLabel}>Session details</Text>
              <Text testID="session-detail-summary" style={styles.sessionDetailValue}>
                {selectedSession.durationMinutes} min · effort {selectedSession.effortScore} · pain{" "}
                {Number.isFinite(Number(selectedSession.painScore))
                  ? `${selectedSession.painScore}/10`
                  : "N/A"}{" "}
                · {selectedSession.variant}
              </Text>

              <Text style={styles.sessionDetailLabel}>Joint discomfort</Text>
              <Text style={styles.sessionDetailValue}>
                {formatJointFeedback(selectedSession.jointFeedback)}
              </Text>

              <Text style={styles.sessionDetailLabel}>Highest joint load</Text>
              <Text testID="session-detail-highest-joint" style={styles.sessionDetailValue}>
                {selectedSessionHighestJoint
                  ? `${formatJointLabel(selectedSessionHighestJoint)}`
                  : "No joint load recorded."}
              </Text>

              <Text style={styles.sessionDetailLabel}>Top joint loads</Text>
              <Text testID="session-detail-top-joint-loads" style={styles.sessionDetailValue}>
                {selectedSessionLoadSummary}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  const addSessionCard = (
    <View testID="card-add-session" style={styles.card} onLayout={captureLayout("load-form-card")}>
      <View style={styles.quickAddHeaderRow}>
        <Text style={styles.sectionTitle}>Add Session</Text>
        <Pressable testID="btn-add-session" style={styles.quickAddButton} onPress={handleAddEntry}>
          <Text style={styles.quickAddButtonText}>Add session</Text>
        </Pressable>
      </View>

      <View onLayout={captureLayout("field-session-pain", "load-form-card")}>
        <Text style={styles.label}>Pain (0-10)</Text>
        <TextInput
          testID="input-session-pain"
          value={sessionPainScore}
          onChangeText={setSessionPainScore}
          onFocus={() => handleInputFocus("field-session-pain")}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <Text style={styles.label}>Exercise template</Text>
      <View style={styles.wrapRow}>
        {templates.map((template) => (
          <Pressable
            key={template.id}
            testID={`btn-template-${template.id}`}
            onPress={() => setTemplateId(template.id)}
            style={[styles.pill, templateId === template.id ? styles.pillActive : styles.pillInactive]}
          >
            <Text
              style={[
                styles.pillText,
                templateId === template.id ? styles.pillTextActive : styles.pillTextInactive
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
            style={[styles.pill, variant === option ? styles.pillActive : styles.pillInactive]}
          >
            <Text
              style={[styles.pillText, variant === option ? styles.pillTextActive : styles.pillTextInactive]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <View onLayout={captureLayout("field-duration-minutes", "load-form-card")}>
        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          testID="input-duration-minutes"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          onFocus={() => handleInputFocus("field-duration-minutes")}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <View onLayout={captureLayout("field-effort-score", "load-form-card")}>
        <Text style={styles.label}>Effort (1-10)</Text>
        <TextInput
          testID="input-effort-score"
          value={effortScore}
          onChangeText={setEffortScore}
          onFocus={() => handleInputFocus("field-effort-score")}
          keyboardType="number-pad"
          style={styles.input}
        />
      </View>

      <Text style={styles.label}>Optional joint discomfort feedback</Text>
      <View style={styles.wrapRow}>
        <Pressable
          testID="btn-feedback-joint-none"
          onPress={() => setFeedbackJoint("none")}
          style={[styles.pill, feedbackJoint === "none" ? styles.pillActive : styles.pillInactive]}
        >
          <Text
            style={[
              styles.pillText,
              feedbackJoint === "none" ? styles.pillTextActive : styles.pillTextInactive
            ]}
          >
            none
          </Text>
        </Pressable>
        {JOINT_IDS.map((jointId) => (
          <Pressable
            key={jointId}
            testID={`btn-feedback-joint-${jointId}`}
            onPress={() => setFeedbackJoint(jointId)}
            style={[styles.pill, feedbackJoint === jointId ? styles.pillActive : styles.pillInactive]}
          >
            <Text
              style={[
                styles.pillText,
                feedbackJoint === jointId ? styles.pillTextActive : styles.pillTextInactive
              ]}
            >
              {jointId}
            </Text>
          </Pressable>
        ))}
      </View>

      {feedbackJoint !== "none" ? (
        <View onLayout={captureLayout("field-joint-feedback", "load-form-card")}>
          <TextInput
            testID="input-joint-feedback"
            value={feedbackScore}
            onChangeText={setFeedbackScore}
            onFocus={() => handleInputFocus("field-joint-feedback")}
            keyboardType="number-pad"
            style={styles.input}
            placeholder="Discomfort 0-10"
            placeholderTextColor="#678475"
          />
        </View>
      ) : null}

      {entryError ? (
        <Text testID="entry-error-text" style={styles.errorText}>
          {entryError}
        </Text>
      ) : null}
    </View>
  );

  const recommendationCard = (
    <View testID="card-todays-recommendation" style={styles.resultCard} onLayout={captureLayout("recommendation-card")}>
      <Text style={styles.resultTitle}>Suggested Session Guidance</Text>
      <Text testID="recommendation-source-text" style={styles.resultSourceText}>
        {todaysCheckIn
          ? "Today's recommendation is based on your current check-in plus recent load."
          : "Save today's check-in to tailor this guidance before training."}
      </Text>
      <Text testID="result-action-label" style={styles.resultItem}>
        Action: {recommendation.action}
      </Text>
      <Text style={styles.resultItem}>Intensity: x{recommendation.intensityMultiplier}</Text>
      <Text style={styles.resultItem}>Overall risk: {loadSummary.overallRisk}</Text>
      <Text style={styles.resultText}>Top stressed joints: {topJointText || "N/A"}</Text>
      <Text style={styles.resultText}>{recommendation.recommendation}</Text>
      {recommendation.overrideApplied ? (
        <Text testID="joint-risk-override-note" style={styles.overrideNote}>
          Joint-load override applied due to elevated risk.
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        ref={scrollViewRef}
        testID="main-scroll"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onLayout={(event) => {
          viewportHeightRef.current = event.nativeEvent.layout.height;
        }}
        onScroll={(event) => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(28, keyboardHeight + 24) }
        ]}
      >
        <Text testID="screen-home-title" style={styles.title}>
          Superstar PT
        </Text>
        <Text style={styles.subtitle}>Session browser + adaptive load intelligence</Text>

        {activeView === "main" ? (
          <>
            {dailyCheckInCard}
            {sessionBrowserCard}
            {addSessionCard}
            {recommendationCard}
            <Pressable
              testID="btn-view-visualization"
              onPress={() => handleViewChange("visualization")}
              style={styles.visualizationShortcut}
            >
              <Text style={styles.visualizationShortcutText}>Open joint-load visualization</Text>
            </Pressable>
          </>
        ) : (
          <View testID="view-joint-load-visualization" style={styles.visualizationView}>
            <Pressable
              testID="btn-view-main"
              onPress={() => handleViewChange("main")}
              style={styles.visualizationShortcut}
            >
              <Text style={styles.visualizationShortcutText}>Back to sessions</Text>
            </Pressable>
            {loadVisualizationCard}
            {recommendationCard}
          </View>
        )}
      </ScrollView>
      <View pointerEvents="box-none" style={styles.feedbackOverlay}>
        <TopFeedbackBanner notice={feedbackNotice} />
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f7f3" },
  feedbackOverlay: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    zIndex: 20
  },
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
  dailyCheckInCard: {
    borderWidth: 1,
    borderColor: "#cfe4d9",
    backgroundColor: "#f9fcfa"
  },
  dailyCheckInSubtext: { fontSize: 13, color: "#3f6a58", marginTop: 4, maxWidth: 220 },
  dailyPromptPanel: {
    backgroundColor: "#eff7f2",
    borderRadius: 12,
    padding: 14,
    gap: 6
  },
  dailyPromptTitle: { fontSize: 16, fontWeight: "700", color: "#184032" },
  dailyPromptText: { fontSize: 14, lineHeight: 20, color: "#365f4e" },
  dailySummaryPanel: {
    backgroundColor: "#edf7ef",
    borderRadius: 12,
    padding: 14,
    gap: 6
  },
  dailySummaryTitle: { fontSize: 16, fontWeight: "700", color: "#184032" },
  dailySummaryText: { fontSize: 14, color: "#214d3b", fontWeight: "600" },
  dailySummaryMeta: { fontSize: 12, color: "#4d7665" },
  dailySummaryNote: { fontSize: 13, color: "#315d4b", lineHeight: 18 },
  dailyEditorCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#d9e9df"
  },
  dailyEditorTitle: { fontSize: 15, fontWeight: "700", color: "#184032" },
  label: { fontSize: 14, color: "#1a3d30", fontWeight: "600" },
  input: {
    backgroundColor: "#f4f7f5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#0d3b2a"
  },
  noteInput: {
    minHeight: 84,
    textAlignVertical: "top"
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
  resultSourceText: { color: "#bde9cf", fontSize: 13, lineHeight: 18 },
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
  dailyEditorActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  secondaryActionButton: {
    backgroundColor: "#deebe3",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  secondaryActionButtonText: { color: "#1d4c38", fontWeight: "700", fontSize: 12 },
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
  sessionBrowserHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  sessionBrowserCount: { fontSize: 13, color: "#3b6855", fontWeight: "700" },
  sessionList: {
    gap: 10
  },
  sessionListItem: {
    borderRadius: 14,
    padding: 12,
    gap: 4
  },
  sessionListItemActive: {
    backgroundColor: "#0f6b47"
  },
  sessionListItemInactive: {
    backgroundColor: "#edf4f0"
  },
  sessionListTitle: { fontSize: 15, fontWeight: "700" },
  sessionListTitleActive: { color: "#ffffff" },
  sessionListTitleInactive: { color: "#173b2e" },
  sessionListMeta: { fontSize: 12, lineHeight: 17 },
  sessionListMetaActive: { color: "#dff8ea" },
  sessionListMetaInactive: { color: "#456a5a" },
  sessionDetailCard: {
    borderRadius: 14,
    backgroundColor: "#f4f7f5",
    padding: 14,
    gap: 6
  },
  sessionDetailHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 2
  },
  sessionDetailHeaderText: {
    flex: 1,
    gap: 2
  },
  sessionDetailTitle: {
    fontSize: 17,
    color: "#103725",
    fontWeight: "700"
  },
  sessionDetailSubtitle: {
    fontSize: 12,
    color: "#4d6f60",
    fontWeight: "600"
  },
  sessionDetailLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#527262",
    fontWeight: "700",
    textTransform: "uppercase"
  },
  sessionDetailValue: {
    fontSize: 14,
    color: "#1c4535",
    lineHeight: 20
  },
  deleteSessionButton: {
    backgroundColor: "#ffe4e4",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  deleteSessionButtonText: {
    color: "#a02d2d",
    fontSize: 12,
    fontWeight: "700"
  },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: "#d5e7de",
    paddingTop: 8,
    gap: 2
  },
  historyTitle: { fontSize: 15, fontWeight: "700", color: "#173b2e" },
  historyText: { fontSize: 13, color: "#2c5b48" }
});
