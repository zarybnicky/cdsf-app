import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/Colors";
import { tabHeaderScreenOptions } from "@/lib/navigation-header";

export default function AppLayout() {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: "#7f8795",
        tabBarStyle: [
          styles.tabBar,
          {
            height: TAB_BAR_HEIGHT + bottomInset,
            paddingBottom: TAB_BAR_BOTTOM_PADDING + bottomInset,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: true,
        ...tabHeaderScreenOptions,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Přehled",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "rectangle.grid.1x2.fill",
                android: "dashboard",
                web: "dashboard",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          headerShown: false,
          title: "Aktuality",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "megaphone.fill",
                android: "campaign",
                web: "campaign",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="competitions"
        options={{
          title: "Soutěže",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "trophy.fill",
                android: "trophy",
                web: "trophy",
              }}
              tintColor={color}
              size={24}
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
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const TAB_BAR_HEIGHT = 60;
const TAB_BAR_BOTTOM_PADDING = 2;

const styles = StyleSheet.create({
  tabBar: {
    borderTopColor: "#dbe2eb",
    backgroundColor: "#fff",
    paddingTop: 2,
  },
  tabBarItem: {
    paddingTop: 2,
    paddingBottom: 0,
  },
  tabBarIcon: {
    marginBottom: 0,
  },
  tabBarLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    lineHeight: 11,
    marginTop: 0,
  },
});
