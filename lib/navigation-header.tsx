import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";

import AppHeaderTitle from "@/components/AppHeaderTitle";
import BrandHeaderBackground from "@/components/BrandHeaderBackground";

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#f4f7fb",
    overflow: "hidden",
  },
});

const sharedHeaderOptions = {
  headerBackground: () => <BrandHeaderBackground />,
  headerShadowVisible: false,
  headerStyle: styles.header,
  headerTitle: AppHeaderTitle,
  headerTitleAlign: "left" as const,
  headerTintColor: "#182334",
  headerTransparent: false,
};

export const tabHeaderScreenOptions = {
  ...sharedHeaderOptions,
} satisfies Pick<
  BottomTabNavigationOptions,
  | "headerBackground"
  | "headerShadowVisible"
  | "headerStyle"
  | "headerTitle"
  | "headerTitleAlign"
  | "headerTintColor"
  | "headerTransparent"
>;

export const stackHeaderScreenOptions = {
  ...sharedHeaderOptions,
  headerBackButtonDisplayMode: "minimal" as const,
} satisfies Pick<
  NativeStackNavigationOptions,
  | "headerBackground"
  | "headerBackButtonDisplayMode"
  | "headerShadowVisible"
  | "headerStyle"
  | "headerTitle"
  | "headerTitleAlign"
  | "headerTintColor"
  | "headerTransparent"
>;

export function withHeaderSubtitle(title: string, subtitle?: string) {
  return {
    title,
    headerTitle: (props) => (
      <AppHeaderTitle {...props} subtitle={subtitle}>
        {title}
      </AppHeaderTitle>
    ),
  } satisfies Pick<NativeStackNavigationOptions, "headerTitle" | "title">;
}
