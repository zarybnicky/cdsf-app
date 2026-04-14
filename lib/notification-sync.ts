import type { components, paths } from "@/CDSF";
import type { InfiniteData } from "@tanstack/react-query";
import { atomWithInfiniteQuery } from "jotai-tanstack-query";

import { appStore } from "@/lib/app-store";
import { fetchClient, getData, paging } from "@/lib/cdsf-client";
import { type NotificationPreferences } from "@/lib/notification-preferences";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import { currentSessionAtom } from "@/lib/session";
import {
  announcementsSeenAtom,
  type AnnouncementSeen,
  getLatestHead,
  hasAnnouncementsBefore,
  isAnnouncementSeen,
} from "@/lib/seen-state";

type Page =
  paths["/notifications"]["get"]["responses"][200]["content"]["application/json"];

export type Notification = components["schemas"]["Notification"];

export type SyncProgress = {
  notifications: Notification[];
  visible: Notification[];
  unseen: Notification[];
  nextPage: number | undefined;
};

type BuiltSyncProgress = SyncProgress & {
  latestCreatedMs: number | null;
};

export type SyncInput = {
  preferences: NotificationPreferences;
  seenState?: AnnouncementSeen;
  token?: string;
};

const pageSize = 10;
const key = ["announcements"] as const;

async function fetchNotificationsPage({
  page,
  pageSize: size,
  signal,
  token,
}: {
  page: number;
  pageSize: number;
  signal?: AbortSignal;
  token: string;
}) {
  return getData(
    await fetchClient.GET("/notifications", {
      headers: {
        Authorization: token,
      },
      params: {
        query: {
          page,
          pageSize: size,
        },
      },
      signal,
    }),
    "Notifications response did not include data.",
  );
}

export const announcementsAtom = atomWithInfiniteQuery((get) => {
  const session = get(currentSessionAtom);

  return {
    enabled: !!session,
    getNextPageParam: paging.next,
    initialPageParam: 1,
    queryKey: key,
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal: AbortSignal;
    }): Promise<Page> => {
      if (!session) {
        throw new Error("Session is not available.");
      }

      return fetchNotificationsPage({
        page: pageParam,
        pageSize,
        signal,
        token: session.token,
      });
    },
  };
});

function buildProgress(
  pages: Page[],
  preferences: NotificationPreferences,
  seenState: AnnouncementSeen,
): BuiltSyncProgress {
  const notifications = pages.flatMap((page) => page.collection || []);
  const visible = notifications.filter(
    (notification) =>
      notification.overrideMuting || preferences[notification.type],
  );
  const { latestCreatedMs } = getLatestHead(notifications);

  return {
    latestCreatedMs,
    notifications,
    visible,
    unseen: visible.filter(
      (notification) => !isAnnouncementSeen(seenState, notification),
    ),
    nextPage: paging.next(pages.at(-1)),
  };
}

function hasBoundary(progress: BuiltSyncProgress, seenState: AnnouncementSeen) {
  return (
    progress.nextPage === undefined ||
    hasAnnouncementsBefore(
      progress.notifications,
      seenState.latestCreatedMs ?? progress.latestCreatedMs,
    )
  );
}

export async function syncNotifications({
  preferences,
  seenState,
  token,
}: SyncInput): Promise<SyncProgress> {
  if (!token) {
    return {
      notifications: [],
      visible: [],
      unseen: [],
      nextPage: undefined,
    };
  }

  const seen = seenState ?? (await appStore.get(announcementsSeenAtom));
  await restoreCache();

  const existing = queryClient.getQueryData<InfiniteData<Page, number>>(key);
  const minimumPageCount = existing?.pages.length ?? 0;
  const data = await queryClient.fetchInfiniteQuery<
    Page,
    Error,
    Page,
    typeof key,
    number
  >({
    getNextPageParam(lastPage, allPages, _lastPageParam, allPageParams) {
      const progress = buildProgress(allPages, preferences, seen);

      if (
        allPageParams.length >= minimumPageCount &&
        hasBoundary(progress, seen)
      ) {
        return undefined;
      }

      return progress.nextPage;
    },
    initialPageParam: 1,
    pages: Math.max(minimumPageCount, 3),
    queryFn: ({ pageParam, signal }) =>
      fetchNotificationsPage({
        page: pageParam,
        pageSize,
        signal,
        token,
      }),
    queryKey: key,
  });

  await saveCache();

  const { latestCreatedMs: _latestCreatedMs, ...progress } = buildProgress(
    data.pages,
    preferences,
    seen,
  );

  return progress;
}
