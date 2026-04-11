import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

import BrandHeaderBackground from "@/components/BrandHeaderBackground";
import BrandMark from "@/components/BrandMark";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackground: () => <BrandHeaderBackground />,
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        headerStyle: styles.header,
        headerTransparent: false,
        headerTitleAlign: "left",
        headerTitleStyle: styles.headerTitle,
        headerTintColor: "#182334",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => <BrandMark size={27} style={styles.headerMark} />,
          title: "Profil",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#f4f7fb",
    overflow: "hidden",
  },
  headerMark: {
    marginLeft: 10,
    marginRight: 4,
  },
  headerTitle: {
    color: "#223045",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
