import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { components, paths } from "@/CDSF";
import { fetchClient, isPagingProps, openapiClient } from "@/lib/cdsf-client";
import {
  filterNotifications,
  type NotificationPreferences,
} from "@/lib/notification-preferences";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import { getSeenState } from "@/lib/seen-state";

type AuthHeaders = {
  Authorization: string;
};

type Page =
  paths["/notifications"]["get"]["responses"][200]["content"]["application/json"];

export type Notification = components["schemas"]["Notification"];
type CachedPages = InfiniteData<Page, number>;

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
  email?: string | null;
  maxPages?: number;
  pageSize?: number;
  persistToCache?: boolean;
  preferences: NotificationPreferences;
  reactQueryClient?: QueryClient;
  seenIds?: ReadonlySet<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
};

export const seenNs = "notifications";
export const pageSize = 10;
const defaultMaxPages = 3;

export function queryInit(
  authHeaders?: AuthHeaders,
  size = pageSize,
) {
  return {
    ...(authHeaders ? { headers: authHeaders } : {}),
    params: {
      query: {
        pageSize: size,
      },
    },
  };
}

export function flattenPages(pages: readonly Page[]) {
  return pages.flatMap((page) => page.collection || []);
}

function mergeData(
  fetched: CachedPages,
  existing: CachedPages | undefined,
) {
  if (!existing) {
    return fetched;
  }

  const pageMap = new Map<number, Page>();

  fetched.pageParams.forEach((pageParam, index) => {
    pageMap.set(pageParam, fetched.pages[index]);
  });

  existing.pageParams.forEach((pageParam, index) => {
    if (!pageMap.has(pageParam)) {
      pageMap.set(pageParam, existing.pages[index]);
    }
  });

  const pageParams = Array.from(pageMap.keys()).sort(
    (left, right) => left - right,
  );

  return {
    pageParams,
    pages: pageParams.map((pageParam) => pageMap.get(pageParam) as Page),
  } satisfies CachedPages;
}

async function fetchPage({
  authHeaders,
  page,
  pageSize: size,
}: {
  authHeaders: AuthHeaders;
  page: number;
  pageSize: number;
}) {
  const response = await fetchClient.GET("/notifications", {
    headers: authHeaders,
    params: {
      query: {
        page,
        pageSize: size,
      },
    },
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
  email,
  maxPages = defaultMaxPages,
  pageSize: size = pageSize,
  persistToCache = true,
  preferences,
  reactQueryClient = queryClient,
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

  const limit = Math.max(1, Math.floor(maxPages));
  const seen = seenIds ?? (await getSeenState(seenNs, email)).ids;
  const pageParams: number[] = [];
  const pages: Page[] = [];
  let nextPage: number | undefined = 1;

  while (nextPage !== undefined && pageParams.length < limit) {
    const pageParam = nextPage;
    const page = await fetchPage({
      authHeaders,
      page: pageParam,
      pageSize: size,
    });

    pageParams.push(pageParam);
    pages.push(page);
    nextPage = isPagingProps.getNextPageParam(page);
    const notifications = flattenPages(pages);
    const visible = filterNotifications(notifications, preferences);
    const unseen = visible.filter(
      (notification) => !seen.has(notification.id.toString()),
    );
    const progress = {
      pageParams,
      pages,
      notifications,
      visible,
      unseen,
      nextPage,
    } satisfies SyncProgress;

    if (stopWhen?.(progress)) {
      break;
    }
  }

  const notifications = flattenPages(pages);
  const visible = filterNotifications(notifications, preferences);
  const unseen = visible.filter(
    (notification) => !seen.has(notification.id.toString()),
  );
  const progress = {
    pageParams,
    pages,
    notifications,
    visible,
    unseen,
    nextPage,
  } satisfies SyncProgress;

  if (persistToCache) {
    await restoreCache();

    const key = openapiClient.queryOptions(
      "get",
      "/notifications",
      queryInit(authHeaders, size),
    ).queryKey;
    const existing = reactQueryClient.getQueryData<CachedPages>(key);
    const next = mergeData(
      {
        pageParams: progress.pageParams,
        pages: progress.pages,
      },
      existing,
    );

    reactQueryClient.setQueryData<CachedPages>(key, next);
    await saveCache();
  }

  return progress;
}
