import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, StyleSheet } from "react-native";
import { enableScreens } from "react-native-screens";
import { LogScreen } from "../screens/log";
import { ProgressScreen } from "../screens/progress";
import { TodayScreen } from "../screens/today";
import { APP_TAB_ROUTES, DEFAULT_TAB_ROUTE, getTabRoute } from "./routeContracts.mjs";

enableScreens();

const Tab = createBottomTabNavigator();
const TodayStack = createNativeStackNavigator();
const LogStack = createNativeStackNavigator();
const ProgressStack = createNativeStackNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f4f0e6",
    border: "#d8cfbf",
    card: "#fffdfa",
    notification: "#b15a30",
    primary: "#1f3128",
    text: "#1f3128"
  }
};

function TodayStackNavigator() {
  const route = getTabRoute("TodayTab");

  return (
    <TodayStack.Navigator screenOptions={stackScreenOptions}>
      <TodayStack.Screen
        name={route.screenName}
        component={TodayScreen}
        options={{ title: route.label }}
      />
    </TodayStack.Navigator>
  );
}

function LogStackNavigator() {
  const route = getTabRoute("LogTab");

  return (
    <LogStack.Navigator screenOptions={stackScreenOptions}>
      <LogStack.Screen name={route.screenName} component={LogScreen} options={{ title: route.label }} />
    </LogStack.Navigator>
  );
}

function ProgressStackNavigator() {
  const route = getTabRoute("ProgressTab");

  return (
    <ProgressStack.Navigator screenOptions={stackScreenOptions}>
      <ProgressStack.Screen
        name={route.screenName}
        component={ProgressScreen}
        options={{ title: route.label }}
      />
    </ProgressStack.Navigator>
  );
}

const stackScreenOptions = {
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: "#fffdfa"
  },
  headerTintColor: "#1f3128",
  headerTitleStyle: {
    fontSize: 20,
    fontWeight: "800"
  },
  contentStyle: {
    backgroundColor: "#f7f3ea"
  }
};

const TAB_COMPONENTS = {
  TodayTab: TodayStackNavigator,
  LogTab: LogStackNavigator,
  ProgressTab: ProgressStackNavigator
};

export function AppNavigator() {
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Tab.Navigator
        initialRouteName={DEFAULT_TAB_ROUTE}
        sceneStyle={styles.scene}
        screenOptions={({ route }) => {
          const tabRoute = getTabRoute(route.name);

          return {
            headerShown: false,
            tabBarActiveTintColor: "#1f3128",
            tabBarInactiveTintColor: "#7a705f",
            tabBarButtonTestID: tabRoute.testID,
            tabBarHideOnKeyboard: Platform.OS !== "ios",
            tabBarLabelStyle: styles.tabLabel,
            tabBarStyle: styles.tabBar
          };
        }}
      >
        {APP_TAB_ROUTES.map((route) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={TAB_COMPONENTS[route.name]}
            options={{ title: route.label }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: "#f7f3ea"
  },
  tabBar: {
    height: 68,
    paddingTop: 8,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#d8cfbf",
    backgroundColor: "#fffdfa"
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700"
  }
});
