import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppScreen,
  SectionHeader,
  SegmentedControl,
  SecondaryActionButton,
  SummaryCard
} from "../../components/ui";
import { appHistoryStore } from "../../historyStore.mjs";
import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens
} from "../../theme/tokens.mjs";
import {
  DEFAULT_PROGRESS_SEGMENT,
  buildProgressScreenState
} from "./progressScreenModel.mjs";

function renderTimelineItem({ item, onOpenSession }) {
  const isSession = item.type === "session" && item.linkedEntityId;
  const content = (
    <>
      <Text style={styles.timelineEyebrow}>{item.title}</Text>
      <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
      {item.detail ? <Text style={styles.timelineDetail}>{item.detail}</Text> : null}
      {isSession ? <Text style={styles.timelineAction}>Open session detail</Text> : null}
    </>
  );

  if (isSession) {
    return (
      <Pressable
        key={item.id}
        onPress={() => onOpenSession(item.linkedEntityId)}
        style={({ pressed }) => [
          styles.timelineItem,
          styles.timelineItemInteractive,
          pressed ? styles.timelineItemPressed : null
        ]}
        testID={`progress-session-item-${item.linkedEntityId}`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View key={item.id} style={styles.timelineItem}>
      {content}
    </View>
  );
}

function renderTimelineSection({ timeline, sessionDetail, onOpenSession, onCloseSession }) {
  if (timeline.items.length === 0) {
    return (
      <SummaryCard
        testID={timeline.testID}
        title={timeline.emptyTitle}
        description={timeline.emptyBody}
        tone="subtle"
      />
    );
  }

  return (
    <View style={styles.sectionStack}>
      <View testID={timeline.testID} style={styles.timelineList}>
        {timeline.items.map((item) => renderTimelineItem({ item, onOpenSession }))}
      </View>
      {sessionDetail.status === "open" ? (
        <SummaryCard
          testID="progress-session-detail"
          title={sessionDetail.title}
          description={sessionDetail.summaryText}
          footer={
            <SecondaryActionButton
              label="Back to timeline"
              onPress={onCloseSession}
              testID="progress-session-detail-close"
            />
          }
          tone="subtle"
        >
          <Text style={styles.detailMeta}>{sessionDetail.performedAtLabel}</Text>
          <Text style={styles.detailMeta}>{sessionDetail.loadSummaryText}</Text>
          {sessionDetail.recommendationStatusLabel ? (
            <Text style={styles.detailMeta}>
              {sessionDetail.recommendationStatusLabel}
              {sessionDetail.recommendationSummaryText ? ` · ${sessionDetail.recommendationSummaryText}` : ""}
            </Text>
          ) : null}
          {sessionDetail.followUpStatusLabel ? (
            <Text style={styles.detailMeta}>
              {sessionDetail.followUpStatusLabel}
              {sessionDetail.followUpSummaryText ? ` · ${sessionDetail.followUpSummaryText}` : ""}
            </Text>
          ) : null}
          {sessionDetail.note ? <Text style={styles.detailNote}>{sessionDetail.note}</Text> : null}
        </SummaryCard>
      ) : null}
    </View>
  );
}

function renderChartRows(load) {
  return load.chart.days.slice(-7).map((day) => (
    <View key={day.dayKey} style={styles.chartRow}>
      <Text style={styles.chartDay}>{day.dayKey.slice(5)}</Text>
      <Text style={styles.chartValue}>
        Total {Math.round(day.values.total || 0)}
        {load.topJointIds[0] ? ` · ${load.topJointIds[0]} ${Math.round(day.values[load.topJointIds[0]] || 0)}` : ""}
      </Text>
    </View>
  ));
}

function renderRiskLegend(load) {
  return load.riskLegend.map((item) => (
    <View key={item.category} style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
      <Text style={styles.legendText}>{item.label}</Text>
    </View>
  ));
}

function renderLoadSection({ load }) {
  if (load.status === "empty") {
    return (
      <SummaryCard
        testID={load.testID}
        title={load.emptyTitle}
        description={load.emptyBody}
        tone="subtle"
      />
    );
  }

  return (
    <View testID={load.testID} style={styles.sectionStack}>
      <SummaryCard title={load.sectionTitle} description={load.sectionBody}>
        <View style={styles.chartStack}>{renderChartRows(load)}</View>
      </SummaryCard>
      <SummaryCard
        title="Risk guide"
        description={load.overallRiskLabel}
        tone="subtle"
      >
        {load.topJointLabel ? <Text style={styles.detailMeta}>Top joint: {load.topJointLabel}</Text> : null}
        {load.referenceJointLabel ? (
          <Text style={styles.detailMeta}>Guide joint: {load.referenceJointLabel}</Text>
        ) : null}
        <View style={styles.legendStack}>{renderRiskLegend(load)}</View>
      </SummaryCard>
    </View>
  );
}

function resolveScreenArgs(props) {
  return {
    checkIns: props.checkIns ?? appHistoryStore.getCheckIns(),
    recommendationSnapshots: props.recommendationSnapshots ?? appHistoryStore.getRecommendationSnapshots(),
    entries: props.entries ?? appHistoryStore.getEntries(),
    followUpTasks: props.followUpTasks ?? appHistoryStore.getFollowUpTasks(),
    templates: props.templates ?? appHistoryStore.getTemplates(),
    toleranceState: props.toleranceState ?? appHistoryStore.getToleranceState(),
    nowIso: props.nowIso ?? new Date().toISOString()
  };
}

export function ProgressScreen(props) {
  const [activeSegment, setActiveSegment] = useState(props.initialSegment || DEFAULT_PROGRESS_SEGMENT);
  const [selectedSessionId, setSelectedSessionId] = useState(props.initialSelectedSessionId || null);

  const screenState = buildProgressScreenState({
    ...resolveScreenArgs(props),
    selectedSegment: activeSegment,
    selectedSessionId
  });

  return (
    <AppScreen testID="screen-progress" contentTestID="screen-progress-content">
      <SectionHeader title={screenState.title} />
      <SummaryCard
        testID={screenState.summary.testID}
        title={screenState.summary.summaryText}
        description={screenState.summary.detailText}
        tone="subtle"
      />
      <SegmentedControl
        testID="progress-segment-control"
        testIdPrefix="progress-segment"
        value={screenState.activeSegment}
        options={screenState.segments.map((segment) => ({
          value: segment.value,
          label: segment.label
        }))}
        onChange={(nextValue) => {
          setActiveSegment(nextValue);
          if (nextValue !== "timeline") {
            setSelectedSessionId(null);
          }
        }}
      />
      {screenState.timeline.visible
        ? renderTimelineSection({
            timeline: screenState.timeline,
            sessionDetail: screenState.sessionDetail,
            onOpenSession: setSelectedSessionId,
            onCloseSession: () => setSelectedSessionId(null)
          })
        : null}
      {screenState.load.visible ? renderLoadSection({ load: screenState.load }) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionStack: {
    gap: spacingTokens.md
  },
  timelineList: {
    gap: spacingTokens.sm
  },
  timelineItem: {
    borderRadius: radiusTokens.card,
    borderWidth: 1,
    borderColor: colorTokens.borderSubtle,
    backgroundColor: colorTokens.surface,
    padding: spacingTokens.md,
    gap: spacingTokens.xs
  },
  timelineItemInteractive: {
    borderColor: colorTokens.borderStrong
  },
  timelineItemPressed: {
    backgroundColor: colorTokens.surfaceAccent
  },
  timelineEyebrow: {
    ...typographyTokens.eyebrow
  },
  timelineSubtitle: {
    ...typographyTokens.sectionTitle,
    fontSize: 19,
    lineHeight: 24
  },
  timelineDetail: {
    ...typographyTokens.body
  },
  timelineAction: {
    ...typographyTokens.caption,
    color: colorTokens.accentPrimary
  },
  detailMeta: {
    ...typographyTokens.caption,
    color: colorTokens.textSecondary
  },
  detailNote: {
    ...typographyTokens.body,
    color: colorTokens.textPrimary
  },
  chartStack: {
    gap: spacingTokens.sm
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingTokens.sm,
    paddingBottom: spacingTokens.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colorTokens.borderSubtle
  },
  chartDay: {
    ...typographyTokens.caption,
    color: colorTokens.textPrimary
  },
  chartValue: {
    ...typographyTokens.body,
    flexShrink: 1,
    textAlign: "right"
  },
  legendStack: {
    gap: spacingTokens.xs
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingTokens.xs
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 999
  },
  legendText: {
    ...typographyTokens.caption,
    color: colorTokens.textSecondary
  }
});
