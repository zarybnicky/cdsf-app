import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { ReactNode, useEffect } from "react";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useColorScheme } from "@/components/useColorScheme";
import { Slot } from "expo-router";
import { Provider as JotaiProvider } from 'jotai';
import { store } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import "../global.css";
import { useHydrateAtoms } from "jotai/utils";
import { queryClientAtom } from 'jotai-tanstack-query'
export { ErrorBoundary } from "expo-router";

// export const unstable_settings = {
//   // Ensure that reloading on `/modal` keeps a back button present.
//   initialRouteName: "gluestack",
// };

// Prevent the splash screen from auto-hiding before asset loading is complete.
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
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      gcTime: 1000 * 60 * 60 * 72,
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
