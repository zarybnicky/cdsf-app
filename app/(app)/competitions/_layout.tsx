import { Stack } from "expo-router";

import { stackHeaderScreenOptions } from "@/lib/navigation-header";

export default function CompetitionsLayout() {
  return (
    <Stack screenOptions={stackHeaderScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="registered" options={{ title: "Soutěže" }} />
      <Stack.Screen name="results" options={{ title: "Soutěže" }} />
      <Stack.Screen name="events/[eventId]" options={{ title: "Událost" }} />
      <Stack.Screen name="[competitionId]" options={{ title: "Soutěž" }} />
      <Stack.Screen
        name="[competitionId]/startlist"
        options={{ title: "Startovní listina" }}
      />
      <Stack.Screen name="[competitionId]/result" options={{ title: "Výsledek" }} />
    </Stack>
  );
}
