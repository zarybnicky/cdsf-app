import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Redirect, Tabs } from "expo-router";
import { useAtomValue } from "jotai";
import { credentialsAtom } from "@/store";

export default function TabLayout() {
  const credentials = useAtomValue(credentialsAtom);

  if (!credentials)
    return <Redirect href="/" />

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarLabelPosition: 'below-icon',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Upozornění",
          tabBarIcon: ({ color }) => <FontAwesome size={18} style={{ marginBottom: -3 }} color={color} name="envelope" />,
        }}
      />

      <Tabs.Screen
        name="competitions"
        options={{
          title: "Soutěže",
          tabBarIcon: ({ color }) => <FontAwesome size={18} style={{ marginBottom: -3 }} color={color} name="calendar" />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <FontAwesome size={18} style={{ marginBottom: -3 }} color={color} name="user" />,
        }}
      />
    </Tabs>
  );
}
