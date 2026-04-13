import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import { QueryClient } from "@tanstack/react-query";
import { queryClientAtom } from "jotai-tanstack-query";

import { appStore } from "@/lib/app-store";

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

export const queryCacheMaxAge = ONE_DAY_IN_MS;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_DAY_IN_MS,
    },
  },
});
appStore.set(queryClientAtom, queryClient);

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "cdsf-app-react-query-cache",
});

let restorePromise: Promise<void> | null = null;

export function markCacheRestoreHandled() {
  restorePromise ??= Promise.resolve();
}

export function restoreCache() {
  if (!restorePromise) {
    restorePromise = persistQueryClientRestore({
      queryClient,
      persister: queryPersister,
      maxAge: queryCacheMaxAge,
    }).catch(() => {
      // Ignore restore failures and continue with a fresh cache.
    });
  }

  return restorePromise;
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
