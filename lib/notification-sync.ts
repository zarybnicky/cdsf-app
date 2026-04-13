import type { components, paths } from "@/CDSF";
import { fetchClient, isPagingProps, openapiClient } from "@/lib/cdsf-client";
import { appStore } from "@/lib/app-store";
import { fetchInfiniteProgress } from "@/lib/infinite-query-sync";
import { type NotificationPreferences } from "@/lib/notification-preferences";
import { announcementsSeenStateAtom } from "@/lib/seen-state";

type AuthHeaders = {
  Authorization: string;
};

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
  authHeaders?: AuthHeaders;
  maxPages?: number;
  pageSize?: number;
  persistToCache?: boolean;
  preferences: NotificationPreferences;
  seenIds?: ReadonlySet<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
};

const pageSize = 10;
const defaultMaxPages = 3;

export function queryInit(authHeaders?: AuthHeaders) {
  return {
    ...(authHeaders ? { headers: authHeaders } : {}),
    params: {
      query: {
        pageSize,
      },
    },
  };
}

async function fetchPage({
  authHeaders,
  pageParam,
  pageSize: size,
  signal,
}: {
  authHeaders: AuthHeaders;
  pageParam: number;
  pageSize: number;
  signal: AbortSignal;
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

export async function syncNotifications({
  authHeaders,
  maxPages = defaultMaxPages,
  pageSize: size = pageSize,
  persistToCache = true,
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
  const queryKey = openapiClient.queryOptions(
    "get",
    "/notifications",
    queryInit(authHeaders),
  ).queryKey;

  return fetchInfiniteProgress<Page, number, SyncProgress>({
    buildProgress({ pages, pageParams }) {
      const notifications = pages.flatMap((page) => page.collection || []);
      const visible = notifications.filter((notification) =>
        notification.overrideMuting ? true : preferences[notification.type],
      );
      const unseen = visible.filter(
        (notification) => !seen.has(notification.id.toString()),
      );
      const latestPage = pages.at(-1);

      return {
        pageParams,
        pages,
        notifications,
        visible,
        unseen,
        nextPage: latestPage
          ? isPagingProps.getNextPageParam(latestPage)
          : undefined,
      } satisfies SyncProgress;
    },
    fetchPage: ({ pageParam, signal }) =>
      fetchPage({
        authHeaders,
        pageParam,
        pageSize: size,
        signal,
      }),
    getNextPageParam({ pages }) {
      const latestPage = pages.at(-1);
      return latestPage
        ? isPagingProps.getNextPageParam(latestPage)
        : undefined;
    },
    initialPageParam: 1,
    maxPages,
    persistToCache,
    queryKey,
    stopWhen,
  });
}
