import { Stack } from "expo-router";
import { sharedHeaderOptions } from "@/lib/navigation-header";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        ...sharedHeaderOptions,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Profil",
        }}
      />
    </Stack>
  );
}
