import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { components, paths } from '@/CDSF';
import { fetchClient, isPagingProps, openapiClient, queryClient } from '@/lib/cdsf-client';
import {
  filterNotifications,
  type NotificationPreferences,
} from '@/lib/notification-preferences';
import { filterUnseenItems, getStoredSeenIds } from '@/lib/seen-state';

type AuthHeaders = {
  Authorization: string;
};

type NotificationsPage = paths['/notifications']['get']['responses'][200]['content']['application/json'];

export type Notification = components['schemas']['Notification'];
export type NotificationsInfiniteData = InfiniteData<NotificationsPage, number>;
export type SyncNotificationsProgress = {
  pages: NotificationsPage[];
  pageParams: number[];
  notifications: Notification[];
  visibleNotifications: Notification[];
  unseenNotifications: Notification[];
  nextPage: number | undefined;
};
export type SyncNotificationsInput = {
  authHeaders?: AuthHeaders;
  email?: string | null;
  maxPages?: number;
  pageSize?: number;
  persistToCache?: boolean;
  preferences: NotificationPreferences;
  reactQueryClient?: QueryClient;
  stopWhen?: (progress: SyncNotificationsProgress) => boolean;
};
export type SyncNotificationsResult = SyncNotificationsProgress;

export const notificationsSeenNamespace = 'notifications';
export const notificationsPageSize = 10;
export const defaultNotificationsSyncMaxPages = 3;

export function getNotificationSeenId(notification: Pick<Notification, 'id'>) {
  return notification.id.toString();
}

export function createNotificationsQueryInit(
  authHeaders?: AuthHeaders,
  pageSize = notificationsPageSize,
) {
  return {
    ...(authHeaders ? { headers: authHeaders } : {}),
    params: {
      query: {
        pageSize,
      },
    },
  };
}

export function getNotificationsQueryKey(authHeaders?: AuthHeaders, pageSize = notificationsPageSize) {
  return openapiClient.queryOptions(
    'get',
    '/notifications',
    createNotificationsQueryInit(authHeaders, pageSize),
  ).queryKey;
}

export function flattenNotificationPages(pages: readonly NotificationsPage[]) {
  return pages.flatMap((page) => page.collection || []);
}

function mergeInfiniteNotificationData(
  fetchedData: NotificationsInfiniteData,
  existingData: NotificationsInfiniteData | undefined,
) {
  if (!existingData) {
    return fetchedData;
  }

  const pageMap = new Map<number, NotificationsPage>();

  fetchedData.pageParams.forEach((pageParam, index) => {
    pageMap.set(pageParam, fetchedData.pages[index]);
  });

  existingData.pageParams.forEach((pageParam, index) => {
    if (!pageMap.has(pageParam)) {
      pageMap.set(pageParam, existingData.pages[index]);
    }
  });

  const pageParams = Array.from(pageMap.keys()).sort((left, right) => left - right);

  return {
    pageParams,
    pages: pageParams.map((pageParam) => pageMap.get(pageParam) as NotificationsPage),
  } satisfies NotificationsInfiniteData;
}

async function fetchNotificationsPage({
  authHeaders,
  page,
  pageSize,
}: {
  authHeaders: AuthHeaders;
  page: number;
  pageSize: number;
}) {
  const response = await fetchClient.GET('/notifications', {
    headers: authHeaders,
    params: {
      query: {
        page,
        pageSize,
      },
    },
  });

  if (response.error) {
    throw response.error;
  }

  if (!response.data) {
    throw new Error('Notifications response did not include data.');
  }

  return response.data;
}

export async function syncNotifications({
  authHeaders,
  email,
  maxPages = defaultNotificationsSyncMaxPages,
  pageSize = notificationsPageSize,
  persistToCache = true,
  preferences,
  reactQueryClient = queryClient,
  stopWhen,
}: SyncNotificationsInput): Promise<SyncNotificationsResult> {
  if (!authHeaders) {
    return {
      pageParams: [],
      pages: [],
      notifications: [],
      visibleNotifications: [],
      unseenNotifications: [],
      nextPage: undefined,
    };
  }

  const maxPagesToFetch = Math.max(1, Math.floor(maxPages));
  const seenIds = await getStoredSeenIds(notificationsSeenNamespace, email);
  const pageParams: number[] = [];
  const pages: NotificationsPage[] = [];
  let nextPage: number | undefined = 1;

  while (nextPage !== undefined && pageParams.length < maxPagesToFetch) {
    const pageParam = nextPage;
    const page = await fetchNotificationsPage({
      authHeaders,
      page: pageParam,
      pageSize,
    });

    pageParams.push(pageParam);
    pages.push(page);
    nextPage = isPagingProps.getNextPageParam(page);

    const notifications = flattenNotificationPages(pages);
    const visibleNotifications = filterNotifications(notifications, preferences);
    const unseenNotifications = filterUnseenItems(
      visibleNotifications,
      seenIds,
      getNotificationSeenId,
    );

    if (
      stopWhen?.({
        pageParams,
        pages,
        notifications,
        visibleNotifications,
        unseenNotifications,
        nextPage,
      })
    ) {
      break;
    }
  }

  const notifications = flattenNotificationPages(pages);
  const visibleNotifications = filterNotifications(notifications, preferences);
  const unseenNotifications = filterUnseenItems(
    visibleNotifications,
    seenIds,
    getNotificationSeenId,
  );

  if (persistToCache) {
    const queryKey = getNotificationsQueryKey(authHeaders, pageSize);
    const existingData = reactQueryClient.getQueryData<NotificationsInfiniteData>(queryKey);
    const nextData = mergeInfiniteNotificationData(
      {
        pageParams,
        pages,
      },
      existingData,
    );

    reactQueryClient.setQueryData<NotificationsInfiniteData>(queryKey, nextData);
  }

  return {
    pageParams,
    pages,
    notifications,
    visibleNotifications,
    unseenNotifications,
    nextPage,
  };
}
