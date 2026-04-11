import { SymbolView } from "expo-symbols";
import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import BrandHeaderBackground from "@/components/BrandHeaderBackground";
import BrandMark from "@/components/BrandMark";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function AnnouncementsLayout() {
  const colorScheme = useColorScheme();

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
          title: "Aktuality",
          headerRight: () => (
            <Link href="/announcements/settings" asChild>
              <Pressable style={styles.settingsButton}>
                {({ pressed }) => (
                  <SymbolView
                    name={{
                      ios: "gearshape.fill",
                      android: "settings",
                      web: "settings",
                    }}
                    size={17}
                    tintColor={Colors[colorScheme].tint}
                    style={{ opacity: pressed ? 0.55 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Stack.Screen name="settings" options={{ title: "Nastavení aktualit" }} />
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
  settingsButton: {
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe6ef",
    backgroundColor: "#f8fbff",
    padding: 7,
  },
});
