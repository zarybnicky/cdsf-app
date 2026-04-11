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
        tabBarItemStyle: styles.tabBarItem,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarLabelStyle: styles.tabBarLabel,
        headerBackground: () => <BrandHeaderBackground />,
        headerTransparent: false,
        headerLeft: () => <BrandMark size={27} style={styles.headerMark} />,
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

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#f4f7fb",
    overflow: "hidden",
  },
  headerLeftContainer: {
    paddingLeft: 10,
  },
  headerMark: {
    marginRight: 4,
  },
  headerTitle: {
    color: "#223045",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  tabBar: {
    height: 60,
    borderTopColor: "#dbe2eb",
    backgroundColor: "#fff",
    paddingTop: 2,
    paddingBottom: 2,
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
