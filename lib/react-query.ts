import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import { QueryClient } from "@tanstack/react-query";

const DAY_MS = 1000 * 60 * 60 * 24;

export const cacheMaxAge = DAY_MS;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: DAY_MS,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "cdsf-app-react-query-cache",
});

let restorePromise: Promise<void> | null = null;

export function markCacheRestored() {
  restorePromise ??= Promise.resolve();
}

export function restoreCache() {
  return (restorePromise ??= persistQueryClientRestore({
    queryClient,
    persister: queryPersister,
    maxAge: cacheMaxAge,
  }).catch(() => {
    // Ignore restore failures and continue with a fresh cache.
  }));
}

export async function saveCache() {
  await restoreCache();
  await persistQueryClientSave({
    queryClient,
    persister: queryPersister,
  });
}

export async function clearCache() {
  queryClient.clear();
  await queryPersister.removeClient();
}
