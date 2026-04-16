import { infiniteQueryOptions } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import type { components, paths } from "@/CDSF";
import { appStore } from "@/lib/app-store";
import { fetchClient, getData, paging } from "@/lib/cdsf-client";
import { stripMarkdown } from "@/lib/markdown";
import { type NotificationPreferences } from "@/lib/notification-preferences";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import {
  announcementsSeenAtom,
  type AnnouncementSeen,
  getAnnouncementCreatedMs,
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
const previewMaxLen = 140;

export const announcementsQueryKey = ["announcements"] as const;

async function fetchNotificationsPage({
  page,
  signal,
  token,
}: {
  page: number;
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
          pageSize,
        },
      },
      signal,
    }),
    "Notifications response did not include data.",
  );
}

function previewText(value: string, maxLength = previewMaxLen) {
  const preview = stripMarkdown(value)
    .replace(/[>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return preview.length <= maxLength
    ? preview
    : `${preview.slice(0, maxLength - 1).trimEnd()}…`;
}

export function getNotificationPreview(notification: Notification) {
  const message = notification.message?.trim();

  if (message) {
    return previewText(message);
  }

  if (notification.author?.trim()) {
    return `Autor: ${notification.author.trim()}`;
  }

  if (notification.contact?.trim()) {
    return `Kontakt: ${notification.contact.trim()}`;
  }

  return "Otevřete aplikaci pro detail aktuality.";
}

export function announcementsQueryOptions(token?: string) {
  return infiniteQueryOptions({
    getNextPageParam: paging.next,
    initialPageParam: 1,
    queryKey: announcementsQueryKey,
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal: AbortSignal;
    }): Promise<Page> => {
      if (!token) {
        throw new Error("Session is not available.");
      }

      return fetchNotificationsPage({
        page: pageParam,
        signal,
        token,
      });
    },
  });
}

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

  const existing = queryClient.getQueryData<InfiniteData<Page, number>>(
    announcementsQueryKey,
  );
  const minimumPageCount = existing?.pages.length ?? 0;
  const data = await queryClient.fetchInfiniteQuery({
    ...announcementsQueryOptions(token),
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
    pages: Math.max(minimumPageCount, 3),
  });

  await saveCache();

  const { latestCreatedMs: _latestCreatedMs, ...progress } = buildProgress(
    data.pages,
    preferences,
    seen,
  );

  return progress;
}
