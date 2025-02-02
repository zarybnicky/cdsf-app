import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useColorScheme } from "@/components/useColorScheme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Provider as JotaiProvider } from 'jotai';
import { queryClientAtom } from 'jotai-tanstack-query';
import { useHydrateAtoms } from "jotai/utils";
import { ReactNode, useEffect } from "react";
import "../global.css";
import { store } from '../store';

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return <RootLayoutNav />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: Infinity
    },
  },
})

const storagePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
})

const HydrateAtoms = ({ children }: { children: ReactNode }) => {
  useHydrateAtoms([[queryClientAtom, queryClient]])
  return children
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: storagePersister }}
    >
      <JotaiProvider store={store}>
        <HydrateAtoms>
          <GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
              <Slot />
            </ThemeProvider>
          </GluestackUIProvider>
        </HydrateAtoms>
      </JotaiProvider>
    </PersistQueryClientProvider>
  );
}
