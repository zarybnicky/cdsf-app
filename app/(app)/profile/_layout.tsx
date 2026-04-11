import { SymbolView } from "expo-symbols";
import { Link, Stack } from "expo-router";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function ProfileLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profil",
          headerRight: () => (
            <Link href="./settings" asChild>
              <Pressable style={{ marginRight: 4 }}>
                {({ pressed }) => (
                  <SymbolView
                    name={{
                      ios: "gearshape.fill",
                      android: "settings",
                      web: "settings",
                    }}
                    size={22}
                    tintColor={Colors[colorScheme].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
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
