import { Stack } from "expo-router";

import { stackHeaderScreenOptions } from "@/lib/navigation-header";

export default function CompetitionsLayout() {
  return (
    <Stack
      screenOptions={{
        ...stackHeaderScreenOptions,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Soutěže",
        }}
      />
    </Stack>
  );
}
