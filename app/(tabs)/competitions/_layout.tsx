import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { withLayoutContext } from "expo-router";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

// Bottom border on topBar
// Icons: medal + cup

export default function TabLayout() {
  return (
    <MaterialTopTabs>
      <MaterialTopTabs.Screen name="index" options={{ title: "Přihlášené" }} />
      <MaterialTopTabs.Screen name="results" options={{ title: "Výsledky" }} />
    </MaterialTopTabs>
  );
}
