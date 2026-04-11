import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

export const queryCacheMaxAge = ONE_DAY_IN_MS;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: ONE_DAY_IN_MS,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'cdsf-app-react-query-cache',
});
