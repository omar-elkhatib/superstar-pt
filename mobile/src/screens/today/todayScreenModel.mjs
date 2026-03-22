import { getTabRoute } from "../../navigation/routeContracts.mjs";

export function resolveOnboardingModalVisible({
  onboarding,
  dismissed = false
} = {}) {
  if (!onboarding?.visible) {
    return false;
  }

  return !dismissed;
}

export function buildRecommendedLogNavigationTarget(recommendationCard) {
  if (
    recommendationCard?.status !== "ready" ||
    !recommendationCard?.recommendationId ||
    !recommendationCard?.logPrefill
  ) {
    return null;
  }

  const logRoute = getTabRoute("LogTab");

  return {
    routeName: logRoute.name,
    params: {
      screen: logRoute.screenName,
      params: {
        entryMode: "recommended",
        recommendationId: recommendationCard.recommendationId,
        recommendedSessionDraft: recommendationCard.logPrefill,
        source: "today_screen"
      }
    }
  };
}

export function resolveRecommendationPrimaryAction(recommendationCard) {
  return recommendationCard?.status === "ready" ? "open_log" : "open_check_in";
}
