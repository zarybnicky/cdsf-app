import { useAtomValue } from "jotai";
import { Redirect, Stack } from "expo-router";

import { currentSessionAtom, sessionStateAtom } from "@/lib/session";

export default function IndexScreen() {
  const session = useAtomValue(currentSessionAtom);
  const sessionState = useAtomValue(sessionStateAtom);
  const isLoading = sessionState === undefined;

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href={session ? "/feed" : "/login"} />
    </>
  );
}
