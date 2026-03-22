import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppScreen,
  PrimaryActionButton,
  SecondaryActionButton,
  SectionHeader,
  SummaryCard
} from "../../components/ui";
import { getTabRoute } from "../../navigation/routeContracts.mjs";
import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens
} from "../../theme/tokens.mjs";
import { buildTodayScreenState } from "../../viewModels/todayScreenState.mjs";
import {
  buildRecommendedLogNavigationTarget,
  resolveOnboardingModalVisible,
  resolveRecommendationPrimaryAction
} from "./todayScreenModel.mjs";

function formatList(values = [], emptyLabel) {
  return values.length > 0 ? values.join(", ") : emptyLabel;
}

function capitalizeLabel(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function resolveScreenState({ route, screenState }) {
  return screenState || route?.params?.screenState || buildTodayScreenState({});
}

function invokeRouteHandler(route, key, payload) {
  const handler = route?.params?.[key];
  if (typeof handler === "function") {
    handler(payload);
  }
}

function RecommendationDetails({ recommendationCard }) {
  return (
    <View style={styles.detailStack}>
      <Text style={styles.detailLabel}>Source</Text>
      <Text style={styles.detailValue}>{recommendationCard.sourceText}</Text>

      <Text style={styles.detailLabel}>Volume</Text>
      <Text style={styles.detailValue}>{recommendationCard.volumeGuidance}</Text>

      <View style={styles.detailRow}>
        <View style={styles.detailChip}>
          <Text style={styles.detailChipLabel}>
            {recommendationCard.overallRiskLabel || "Low load risk"}
          </Text>
        </View>
        <View style={styles.detailChip}>
          <Text style={styles.detailChipLabel}>
            Status: {capitalizeLabel(recommendationCard.adherenceStatus || "pending")}
          </Text>
        </View>
      </View>

      <Text style={styles.detailMeta}>
        Intensity x{recommendationCard.intensityMultiplier}{" "}
        {recommendationCard.topJointLabel ? `• Top joint ${recommendationCard.topJointLabel}` : ""}
      </Text>
    </View>
  );
}

function CheckInDetails({ checkInCard }) {
  if (checkInCard.status === "missing") {
    return (
      <View style={styles.detailStack}>
        <Text style={styles.detailValue}>{checkInCard.emptyTitle}</Text>
        <Text style={styles.detailMeta}>{checkInCard.emptyBody}</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailStack}>
      <Text style={styles.detailValue}>{checkInCard.summary?.painLabel}</Text>
      <Text style={styles.detailValue}>{checkInCard.summary?.readinessLabel}</Text>
      <Text style={styles.detailValue}>{checkInCard.summary?.fatigueLabel}</Text>
      {checkInCard.summary?.note ? (
        <Text style={styles.detailMeta}>{checkInCard.summary.note}</Text>
      ) : null}
    </View>
  );
}

function FollowUpDetails({ followUpCard }) {
  return (
    <View style={styles.detailStack}>
      <Text style={styles.detailValue}>{followUpCard.summaryText}</Text>
      {followUpCard.detailLabel ? <Text style={styles.detailMeta}>{followUpCard.detailLabel}</Text> : null}
      {followUpCard.timingLabel ? <Text style={styles.detailMeta}>{followUpCard.timingLabel}</Text> : null}
      {followUpCard.remainingCount > 0 ? (
        <Text style={styles.detailMeta}>
          {followUpCard.remainingCount} more follow-up
          {followUpCard.remainingCount === 1 ? "" : "s"} waiting
        </Text>
      ) : null}
    </View>
  );
}

function WeeklyDetails({ weeklySummaryCard }) {
  return (
    <View style={styles.detailStack}>
      <Text style={styles.detailValue}>{weeklySummaryCard.summaryText}</Text>
      <Text style={styles.detailMeta}>
        {weeklySummaryCard.topJointLabel
          ? `Top stressed joint: ${weeklySummaryCard.topJointLabel}`
          : weeklySummaryCard.detailText}
      </Text>
    </View>
  );
}

function OnboardingModal({ onboarding, onClose }) {
  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
      visible
      onRequestClose={onClose}
    >
      <View style={styles.modalScrim}>
        <Pressable style={styles.modalDismissArea} onPress={onClose} />
        <View style={styles.modalSheet}>
          <SectionHeader
            eyebrow="Quick Baseline"
            title="Onboarding"
            subtitle={onboarding.bodyText}
          />

          <SummaryCard
            title="Current baseline"
            description="These answers add early context so the first recommendations feel less generic."
            tone="subtle"
          >
            <View style={styles.detailStack}>
              <Text style={styles.detailLabel}>Goals</Text>
              <Text style={styles.detailValue}>
                {formatList(onboarding.profile?.goals || [], "No goals selected yet")}
              </Text>
              <Text style={styles.detailLabel}>Activity level</Text>
              <Text style={styles.detailValue}>
                {onboarding.profile?.activityLevel || "No activity level selected yet"}
              </Text>
              <Text style={styles.detailLabel}>Sensitive areas</Text>
              <Text style={styles.detailValue}>
                {formatList(onboarding.profile?.sensitiveAreas || [], "No sensitive areas selected yet")}
              </Text>
            </View>
          </SummaryCard>

          <PrimaryActionButton
            label="Continue baseline"
            hint="Hand off into the onboarding editor during integration."
            onPress={onClose}
            testID="today-onboarding-continue"
          />
          <SecondaryActionButton
            label="Not now"
            onPress={onClose}
            testID="today-onboarding-dismiss"
          />
        </View>
      </View>
    </Modal>
  );
}

export function TodayScreen({ navigation, route, screenState }) {
  const todayState = resolveScreenState({ route, screenState });
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);
  const [isOnboardingModalOpen, setOnboardingModalOpen] = useState(() =>
    resolveOnboardingModalVisible({
      onboarding: todayState.onboarding
    })
  );

  useEffect(() => {
    const shouldShow = resolveOnboardingModalVisible({
      onboarding: todayState.onboarding,
      dismissed: dismissedOnboarding
    });
    setOnboardingModalOpen(shouldShow);
  }, [dismissedOnboarding, todayState.onboarding]);

  function handleOpenCheckIn() {
    invokeRouteHandler(route, "onOpenCheckIn", todayState.checkInCard);
  }

  function handleLogRecommendedSession() {
    const primaryAction = resolveRecommendationPrimaryAction(todayState.recommendationCard);
    if (primaryAction === "open_check_in") {
      handleOpenCheckIn();
      return;
    }

    const target = buildRecommendedLogNavigationTarget(todayState.recommendationCard);
    if (target) {
      navigation?.navigate(target.routeName, target.params);
      invokeRouteHandler(route, "onLogRecommendedSession", target);
    }
  }

  function handleSkipRecommendation() {
    invokeRouteHandler(route, "onSkipRecommendation", todayState.recommendationCard);
  }

  function handleOpenFollowUp() {
    invokeRouteHandler(route, "onOpenFollowUp", todayState.followUpCard);
  }

  function handleOpenProgress() {
    const progressRoute = getTabRoute("ProgressTab");
    navigation?.navigate(progressRoute.name, { screen: progressRoute.screenName });
    invokeRouteHandler(route, "onOpenProgress", progressRoute);
  }

  function handleOpenOnboarding() {
    setDismissedOnboarding(false);
    setOnboardingModalOpen(true);
  }

  function handleCloseOnboarding() {
    setDismissedOnboarding(true);
    setOnboardingModalOpen(false);
    invokeRouteHandler(route, "onDismissOnboarding", todayState.onboarding);
  }

  return (
    <AppScreen testID="today-screen" contentTestID="today-screen-content">
      <SectionHeader
        eyebrow="Daily plan"
        title="Today"
        subtitle="Check in, review the recommendation, and keep the next action obvious."
      />

      <SummaryCard
        testID="today-checkin-card"
        title={todayState.checkInCard.title}
        description={todayState.checkInCard.bodyText}
        eyebrow="Check-in"
        tone={todayState.checkInCard.status === "missing" ? "subtle" : "default"}
        footer={
          <PrimaryActionButton
            label={todayState.checkInCard.ctaLabel}
            onPress={handleOpenCheckIn}
            testID="today-checkin-cta"
          />
        }
      >
        <CheckInDetails checkInCard={todayState.checkInCard} />
      </SummaryCard>

      <SummaryCard
        testID="today-recommendation-card"
        title="Recommendation"
        value={
          todayState.recommendationCard.status === "ready"
            ? todayState.recommendationCard.activityType
            : "Locked"
        }
        description={todayState.recommendationCard.summaryText}
        eyebrow="Hero"
        tone={todayState.recommendationCard.status === "ready" ? "accent" : "subtle"}
        footer={
          <View style={styles.footerActions}>
            <PrimaryActionButton
              label={todayState.recommendationCard.ctaLabel}
              onPress={handleLogRecommendedSession}
              testID="today-log-recommended-session"
            />
            {todayState.recommendationCard.secondaryCtaLabel ? (
              <SecondaryActionButton
                label={todayState.recommendationCard.secondaryCtaLabel}
                onPress={handleSkipRecommendation}
                testID="today-skip-recommendation"
              />
            ) : null}
          </View>
        }
      >
        <RecommendationDetails recommendationCard={todayState.recommendationCard} />
      </SummaryCard>

      <SummaryCard
        testID="today-followup-card"
        title="Follow-up"
        description={todayState.followUpCard.title}
        eyebrow="Delayed outcome"
        tone={todayState.followUpCard.status === "overdue" ? "accent" : "subtle"}
        footer={
          todayState.followUpCard.ctaLabel ? (
            <SecondaryActionButton
              label={todayState.followUpCard.ctaLabel}
              onPress={handleOpenFollowUp}
              testID="today-followup-cta"
            />
          ) : null
        }
      >
        <FollowUpDetails followUpCard={todayState.followUpCard} />
      </SummaryCard>

      <SummaryCard
        title="Weekly summary"
        value={todayState.weeklySummaryCard.sessionCount}
        description={todayState.weeklySummaryCard.riskLabel}
        eyebrow="Teaser"
        tone="default"
        footer={
          <SecondaryActionButton
            label={todayState.weeklySummaryCard.ctaLabel}
            onPress={handleOpenProgress}
            testID="today-open-progress"
          />
        }
      >
        <WeeklyDetails weeklySummaryCard={todayState.weeklySummaryCard} />
      </SummaryCard>

      {todayState.onboarding.visible ? (
        <SummaryCard
          title="Quick Baseline"
          description={todayState.onboarding.bodyText}
          eyebrow="Onboarding"
          tone="subtle"
          footer={
            <View style={styles.footerActions}>
              <PrimaryActionButton
                label="Open baseline"
                onPress={handleOpenOnboarding}
                testID="today-open-onboarding"
              />
              <SecondaryActionButton
                label="Not now"
                onPress={handleCloseOnboarding}
                testID="today-dismiss-onboarding"
              />
            </View>
          }
        >
          <Text style={styles.detailMeta}>
            Open the baseline sheet when you want to add a little starting context for early guidance.
          </Text>
        </SummaryCard>
      ) : null}

      {isOnboardingModalOpen ? (
        <OnboardingModal onboarding={todayState.onboarding} onClose={handleCloseOnboarding} />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  detailStack: {
    gap: spacingTokens.xs
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingTokens.xs
  },
  detailLabel: {
    ...typographyTokens.eyebrow
  },
  detailValue: {
    ...typographyTokens.body,
    color: colorTokens.textPrimary
  },
  detailMeta: {
    ...typographyTokens.caption
  },
  detailChip: {
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.sm,
    paddingVertical: spacingTokens.xs,
    backgroundColor: colorTokens.accentSoft
  },
  detailChipLabel: {
    ...typographyTokens.caption,
    color: colorTokens.accentSoftText
  },
  footerActions: {
    gap: spacingTokens.sm
  },
  modalScrim: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(16, 34, 53, 0.28)"
  },
  modalDismissArea: {
    flex: 1
  },
  modalSheet: {
    borderTopLeftRadius: radiusTokens.card,
    borderTopRightRadius: radiusTokens.card,
    backgroundColor: colorTokens.surface,
    paddingHorizontal: spacingTokens.screenHorizontal,
    paddingTop: spacingTokens.lg,
    paddingBottom: spacingTokens.xxl,
    gap: spacingTokens.md
  }
});
