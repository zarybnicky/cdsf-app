import { useAtomValue } from "jotai";
import { Redirect, Stack } from "expo-router";

import { sessionStateAtom } from "@/lib/session";

export default function IndexScreen() {
  const session = useAtomValue(sessionStateAtom);
  const isLoading = session === undefined;

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href={session ? "/dashboard" : "/login"} />
    </>
  );
}
