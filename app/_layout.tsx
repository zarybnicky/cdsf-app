import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { NotificationPreferencesProvider } from "@/lib/notification-preferences-provider";
import { useAnnouncementsNotificationRuntime } from "@/lib/notification-runtime";
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
  hasRestoredQueryCache: boolean;
};

function RootNavigator({
  fontsLoaded,
  hasRestoredQueryCache,
}: RootNavigatorProps) {
  const { isLoading, session } = useSession();
  const colorScheme = useColorScheme();
  const isAppReady = fontsLoaded && hasRestoredQueryCache && !isLoading;
  const notificationRuntimeSession = isAppReady ? session : null;

  useAnnouncementsNotificationRuntime(notificationRuntimeSession);

  useEffect(() => {
    if (isAppReady) {
      void SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
  const [hasRestoredQueryCache, setHasRestoredQueryCache] = useState(false);
  const handleQueryCacheRestoreSettled = () => {
    setHasRestoredQueryCache(true);
  };

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: queryCacheMaxAge }}
      onSuccess={handleQueryCacheRestoreSettled}
      onError={handleQueryCacheRestoreSettled}
    >
      <SessionProvider>
        <NotificationPreferencesProvider>
          <RootNavigator
            fontsLoaded={fontsLoaded}
            hasRestoredQueryCache={hasRestoredQueryCache}
          />
        </NotificationPreferencesProvider>
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}
