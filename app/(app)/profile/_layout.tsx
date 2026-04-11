import { SymbolView } from "expo-symbols";
import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import BrandHeaderBackground from "@/components/BrandHeaderBackground";
import BrandMark from "@/components/BrandMark";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function ProfileLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerBackground: () => <BrandHeaderBackground />,
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        headerTitleAlign: "left",
        headerTitleStyle: styles.headerTitle,
        headerTintColor: "#182334",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerLeft: () => <BrandMark size={30} style={styles.headerMark} />,
          title: "Profil",
          headerRight: () => (
            <Link href="./settings" asChild>
              <Pressable style={styles.settingsButton}>
                {({ pressed }) => (
                  <SymbolView
                    name={{
                      ios: "gearshape.fill",
                      android: "settings",
                      web: "settings",
                    }}
                    size={18}
                    tintColor={Colors[colorScheme].tint}
                    style={{ opacity: pressed ? 0.55 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Stack.Screen name="settings" options={{ title: "Nastavení" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerMark: {
    marginLeft: 12,
    marginRight: 6,
  },
  headerTitle: {
    color: "#182334",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  settingsButton: {
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#f4f7fd",
    padding: 8,
  },
});
