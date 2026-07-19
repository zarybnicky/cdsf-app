import { appStore } from "@/lib/app-store";
import { seenNotificationsAtom } from "@/lib/atoms";
import { sessionStateAtom } from "@/lib/session";
import { setAuthenticatedSyncEnabled } from "@/lib/sync-runtime";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
  type NotificationResponse,
} from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import "react-native-reanimated";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(app)",
};

void SplashScreen.preventAutoHideAsync();

type RootNavigatorProps = {
  fontsLoaded: boolean;
};

function RootNavigator({ fontsLoaded }: RootNavigatorProps) {
  const router = useRouter();
  const session = useAtomValue(sessionStateAtom);
  const isSessionLoading = session === undefined;
  const isAuthenticated = session !== null && session !== undefined;
  const isAppReady = fontsLoaded && !isSessionLoading;
  const handledNotification = useRef<string | null>(null);

  useEffect(() => {
    if (isAppReady) {
      void SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  useEffect(() => {
    if (!isSessionLoading) {
      setAuthenticatedSyncEnabled(isAuthenticated);
    }
  }, [isAuthenticated, isSessionLoading]);

  useEffect(() => {
    if (!isAuthenticated) {
      handledNotification.current = null;
      return;
    }

    const handleNotificationResponse = (resp: NotificationResponse) => {
      const requestId = resp.notification.request.identifier;
      if (handledNotification.current === requestId) return;
      handledNotification.current = requestId;

      const data = resp.notification.request.content.data as {
        type?: string;
        id?: number;
        competitionId?: number;
      };
      if (data.type === "result" && data.competitionId) {
        router.push({
          pathname: "/competitions/[competitionId]/result",
          params: { competitionId: data.competitionId },
        });
      } else if (data.type === "registration" && data.competitionId) {
        router.push("/competitions/registered");
      } else if (data.type === "notification" && data.id) {
        appStore.set(seenNotificationsAtom, (seen) => ({
          ...seen,
          [String(data.id)]: Date.now(),
        }));
        router.push("/announcements");
      }
      clearLastNotificationResponse();
    };
    if (Platform.OS !== 'web') {
      const lastResponse = getLastNotificationResponse();
      if (lastResponse) handleNotificationResponse(lastResponse);
    }
    const tapSub = addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    return () => {
      tapSub.remove();
    };
  }, [isAuthenticated, router]);

  if (!isAppReady) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar backgroundColor="#f4f7fb" style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="announcements" options={{ headerShown: false }} />
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
  if (error) {
    throw error;
  }

  return (
    <JotaiProvider store={appStore}>
      <RootNavigator fontsLoaded={fontsLoaded} />
    </JotaiProvider>
  );
}
