import type { components, paths } from "@/CDSF";
import type { InfiniteData } from "@tanstack/react-query";
import { atomWithInfiniteQuery } from "jotai-tanstack-query";

import { appStore } from "@/lib/app-store";
import { fetchClient, isPagingProps } from "@/lib/cdsf-client";
import { type NotificationPreferences } from "@/lib/notification-preferences";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import { sessionValueAtom } from "@/lib/session";
import { announcementsSeenStateAtom } from "@/lib/seen-state";

type Page =
  paths["/notifications"]["get"]["responses"][200]["content"]["application/json"];

export type Notification = components["schemas"]["Notification"];

export type SyncProgress = {
  pages: Page[];
  pageParams: number[];
  notifications: Notification[];
  visible: Notification[];
  unseen: Notification[];
  nextPage: number | undefined;
};

export type SyncInput = {
  authHeaders?: {
    Authorization: string;
  };
  maxPages?: number;
  pageSize?: number;
  preferences: NotificationPreferences;
  seenIds?: ReadonlySet<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
};

const pageSize = 10;
const defaultMaxPages = 3;

async function fetchNotificationsPage({
  authHeaders,
  pageParam,
  pageSize: size,
  signal,
}: {
  authHeaders: {
    Authorization: string;
  };
  pageParam: number;
  pageSize: number;
  signal?: AbortSignal;
}) {
  const response = await fetchClient.GET("/notifications", {
    headers: authHeaders,
    params: {
      query: {
        page: pageParam,
        pageSize: size,
      },
    },
    signal,
  });

  if (response.error) {
    throw response.error;
  }

  if (!response.data) {
    throw new Error("Notifications response did not include data.");
  }

  return response.data;
}

export const announcementsInfiniteQueryAtom =
  atomWithInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page, number>,
    readonly ["announcements"],
    number
  >(
    (get) => {
      const session = get(sessionValueAtom);

      return {
        enabled: !!session,
        getNextPageParam(lastPage) {
          return isPagingProps.getNextPageParam(lastPage);
        },
        initialPageParam: 1,
        queryKey: ["announcements"] as const,
        queryFn: async ({ pageParam, signal }) => {
          if (!session) {
            throw new Error("Session is not available.");
          }

          return fetchNotificationsPage({
            authHeaders: {
              Authorization: session.token,
            },
            pageParam,
            pageSize,
            signal,
          });
        },
      };
    },
  );

function normalizeMaxPages(maxPages: number) {
  if (!Number.isFinite(maxPages)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(1, Math.floor(maxPages));
}

function buildSyncProgress(
  pages: Page[],
  pageParams: number[],
  preferences: NotificationPreferences,
  seen: ReadonlySet<string>,
) {
  const notifications = pages.flatMap((page) => page.collection || []);
  const visible = notifications.filter((notification) =>
    notification.overrideMuting ? true : preferences[notification.type],
  );
  const latestPage = pages.at(-1);

  return {
    pageParams,
    pages,
    notifications,
    visible,
    unseen: visible.filter((notification) => !seen.has(notification.id.toString())),
    nextPage: latestPage ? isPagingProps.getNextPageParam(latestPage) : undefined,
  } satisfies SyncProgress;
}

export async function syncNotifications({
  authHeaders,
  maxPages = defaultMaxPages,
  pageSize: size = pageSize,
  preferences,
  seenIds,
  stopWhen,
}: SyncInput): Promise<SyncProgress> {
  if (!authHeaders) {
    return {
      pageParams: [],
      pages: [],
      notifications: [],
      visible: [],
      unseen: [],
      nextPage: undefined,
    };
  }

  const seen = seenIds ?? (await appStore.get(announcementsSeenStateAtom)).ids;
  await restoreCache();

  const existing =
    queryClient.getQueryData<InfiniteData<Page, number>>(["announcements"]);
  const minimumPageCount = existing?.pages.length ?? 0;
  const data = await queryClient.fetchInfiniteQuery<
    Page,
    Error,
    Page,
    readonly ["announcements"],
    number
  >({
    getNextPageParam(lastPage, allPages, _lastPageParam, allPageParams) {
      if (
        allPageParams.length >= minimumPageCount &&
        stopWhen?.(buildSyncProgress(allPages, allPageParams, preferences, seen))
      ) {
        return undefined;
      }

      return isPagingProps.getNextPageParam(lastPage);
    },
    initialPageParam: 1,
    pages: Math.max(minimumPageCount, normalizeMaxPages(maxPages)),
    queryFn: ({ pageParam, signal }) =>
      fetchNotificationsPage({
        authHeaders,
        pageParam,
        pageSize: size,
        signal,
      }),
    queryKey: ["announcements"] as const,
  });

  await saveCache();

  return buildSyncProgress(data.pages, data.pageParams, preferences, seen);
}
