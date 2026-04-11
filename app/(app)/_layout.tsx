import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function AppLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: "#b8c0cc",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#e3e7ee",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#f3f5f9",
        },
        headerTitleStyle: {
          color: "#6f7887",
          fontSize: 17,
          fontWeight: "700",
          letterSpacing: 0.4,
        },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="announcements"
        options={{
          title: "Aktuality",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "megaphone.fill",
                android: "campaign",
                web: "campaign",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="competitions"
        options={{
          title: "Soutěže",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "trophy.fill",
                android: "trophy",
                web: "trophy",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "person.fill",
                android: "person",
                web: "person",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
