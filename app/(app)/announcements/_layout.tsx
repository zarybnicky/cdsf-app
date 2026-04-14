import { SymbolView } from "expo-symbols";
import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import Colors from "@/constants/Colors";
import { stackHeaderScreenOptions } from "@/lib/navigation-header";

export default function AnnouncementsLayout() {
  return (
    <Stack screenOptions={stackHeaderScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
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
                    tintColor={Colors.light.tint}
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
