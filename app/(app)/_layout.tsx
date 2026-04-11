import { StyleSheet } from "react-native";
import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import BrandHeaderBackground from "@/components/BrandHeaderBackground";
import BrandMark from "@/components/BrandMark";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function AppLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: "#7f8795",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerBackground: () => <BrandHeaderBackground />,
        headerLeft: () => <BrandMark size={31} style={styles.headerMark} />,
        headerLeftContainerStyle: styles.headerLeftContainer,
        headerShadowVisible: false,
        headerStyle: styles.header,
        headerTitleAlign: "left",
        headerTitleStyle: styles.headerTitle,
        headerShown: true,
        headerTintColor: "#182334",
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

const styles = StyleSheet.create({
  header: {
    backgroundColor: "transparent",
  },
  headerLeftContainer: {
    paddingLeft: 12,
  },
  headerMark: {
    marginRight: 6,
  },
  headerTitle: {
    color: "#182334",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  tabBar: {
    height: 64,
    borderTopColor: "#dbe2eb",
    backgroundColor: "#fff",
    paddingTop: 6,
    paddingBottom: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
});
