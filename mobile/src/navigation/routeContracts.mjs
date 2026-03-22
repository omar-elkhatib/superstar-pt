// These route names are frozen so screen work can land in parallel without renaming churn.
export const DEFAULT_TAB_ROUTE = "TodayTab";

export const APP_TAB_ROUTES = [
  {
    name: "TodayTab",
    label: "Today",
    stackName: "TodayStack",
    screenName: "TodayScreen",
    testID: "shell-tab-today"
  },
  {
    name: "LogTab",
    label: "Log",
    stackName: "LogStack",
    screenName: "LogScreen",
    testID: "shell-tab-log"
  },
  {
    name: "ProgressTab",
    label: "Progress",
    stackName: "ProgressStack",
    screenName: "ProgressScreen",
    testID: "shell-tab-progress"
  }
];

export function getTabRoute(routeName = DEFAULT_TAB_ROUTE) {
  return APP_TAB_ROUTES.find((route) => route.name === routeName) || APP_TAB_ROUTES[0];
}
