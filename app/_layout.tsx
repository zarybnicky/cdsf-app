import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { appStore } from "@/lib/app-store";
import { useNotificationRuntime } from "@/lib/notification-runtime";
import {
  cacheMaxAge,
  markCacheRestored,
  queryClient,
  queryPersister,
} from "@/lib/react-query";
import {
  ensureSessionMiddleware,
  sessionStateAtom,
} from "@/lib/session";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(app)",
};

void SplashScreen.preventAutoHideAsync();
ensureSessionMiddleware();

type RootNavigatorProps = {
  fontsLoaded: boolean;
  cacheReady: boolean;
};

function RootNavigator({ fontsLoaded, cacheReady }: RootNavigatorProps) {
  const sessionState = useAtomValue(sessionStateAtom);
  const isSessionLoading = sessionState.state === "loading";
  const session = sessionState.state === "hasData" ? sessionState.data : null;
  const isAppReady = fontsLoaded && cacheReady && !isSessionLoading;

  useNotificationRuntime(isAppReady);

  useEffect(() => {
    if (isAppReady) {
      void SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar backgroundColor="#f4f7fb" style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={session !== null}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={session === null}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [cacheReady, setCacheReady] = useState(false);
  const handleCacheReady = () => {
    markCacheRestored();
    setCacheReady(true);
  };

  if (error) {
    throw error;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: cacheMaxAge }}
      onSuccess={handleCacheReady}
      onError={handleCacheReady}
    >
      <JotaiProvider store={appStore}>
        <RootNavigator fontsLoaded={fontsLoaded} cacheReady={cacheReady} />
      </JotaiProvider>
    </PersistQueryClientProvider>
  );
}
