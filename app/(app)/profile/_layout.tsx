import { Stack } from "expo-router";
import { stackHeaderScreenOptions } from "@/lib/navigation-header";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={stackHeaderScreenOptions}>
      <Stack.Screen
        name="index"
        options={{
          title: "Profil",
        }}
      />
    </Stack>
  );
}
