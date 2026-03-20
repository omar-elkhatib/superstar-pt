export const DEFAULT_APP_SCREEN = "home";

export const APP_SHELL_SCREENS = [
  { id: "home", label: "Home" },
  { id: "log", label: "Log" },
  { id: "history", label: "History" },
  { id: "insights", label: "Insights" }
];

export function getScreenDefinition(screenId) {
  return APP_SHELL_SCREENS.find((screen) => screen.id === screenId) || APP_SHELL_SCREENS[0];
}

export function buildScreenVisibilityMap(activeScreen = DEFAULT_APP_SCREEN) {
  return Object.fromEntries(
    APP_SHELL_SCREENS.map((screen) => [
      screen.id,
      {
        ...screen,
        isVisible: screen.id === activeScreen
      }
    ])
  );
}

