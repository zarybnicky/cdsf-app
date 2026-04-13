import { useAtomValue } from "jotai";
import { Redirect, Stack } from "expo-router";

import { sessionLoadableAtom } from "@/lib/session";

export default function IndexScreen() {
  const sessionState = useAtomValue(sessionLoadableAtom);
  const isLoading = sessionState.state === "loading";
  const session = sessionState.state === "hasData" ? sessionState.data : null;

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href={session ? "/announcements" : "/login"} />
    </>
  );
}
