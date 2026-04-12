import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { NotificationPreferencesProvider } from "@/lib/notification-preferences-provider";
import { useNotificationRuntime } from "@/lib/notification-runtime";
import {
  queryCacheMaxAge,
  queryClient,
  queryPersister,
} from "@/lib/react-query";
import { SessionProvider, useSession } from "@/lib/session";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(app)",
};

void SplashScreen.preventAutoHideAsync();

type RootNavigatorProps = {
  fontsLoaded: boolean;
  cacheReady: boolean;
};

function RootNavigator({
  fontsLoaded,
  cacheReady,
}: RootNavigatorProps) {
  const { isLoading, session } = useSession();
  const isAppReady = fontsLoaded && cacheReady && !isLoading;

  useNotificationRuntime(isAppReady ? session : null);

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
  const onCacheReady = () => setCacheReady(true);

  if (error) {
    throw error;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: queryCacheMaxAge }}
      onSuccess={onCacheReady}
      onError={onCacheReady}
    >
      <SessionProvider>
        <NotificationPreferencesProvider>
          <RootNavigator
            fontsLoaded={fontsLoaded}
            cacheReady={cacheReady}
          />
        </NotificationPreferencesProvider>
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}
