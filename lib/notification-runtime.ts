import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { useRouter } from "expo-router";

import { announcementsHref } from "@/lib/app-routes";
import { notificationToAnnouncementCard } from "@/lib/cdsf-formatters";
import { getStoredNotificationPreferences } from "@/lib/notification-preferences";
import {
  getNotificationSeenId,
  notificationsSeenNamespace,
  syncNotifications,
  type Notification,
} from "@/lib/notification-sync";
import type { Session } from "@/lib/session";
import { getStoredSession } from "@/lib/session";
import { getStoredSeenIds, markSeenIds } from "@/lib/seen-state";

const announcementsBackgroundTaskName = "cdsf-announcements-background-sync";
const announcementsNotificationChannelId = "cdsf-announcements";
const announcementsBackgroundIntervalMinutes = 15;
const isWeb = Platform.OS === "web";

type AnnouncementHref = typeof announcementsHref;
type AnnouncementNotificationData = {
  href: AnnouncementHref;
};
type NotificationPermissions = Awaited<
  ReturnType<typeof Notifications.getPermissionsAsync>
>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function allowsNotifications(permissions: NotificationPermissions) {
  return (
    permissions.granted ||
    permissions.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function markNotificationsSeenForSession(
  session: Session,
  notifications: readonly Pick<Notification, "id">[],
) {
  await markSeenIds(
    notificationsSeenNamespace,
    notifications.map(getNotificationSeenId),
    session.email,
  );
}

async function areAnnouncementsNotificationsAllowedAsync(requestIfNeeded: boolean) {
  if (isWeb) {
    return false;
  }

  const currentPermissions = await Notifications.getPermissionsAsync();

  if (allowsNotifications(currentPermissions)) {
    return true;
  }

  if (!requestIfNeeded || !currentPermissions.canAskAgain) {
    return false;
  }

  const nextPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return allowsNotifications(nextPermissions);
}

async function ensureAnnouncementsNotificationChannelAsync() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    announcementsNotificationChannelId,
    {
      name: "Aktuality",
      description: "Upozornění na nová sdělení v části Aktuality.",
      enableLights: true,
      enableVibrate: true,
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#2f67ce",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
      sound: "default",
      vibrationPattern: [0, 250, 150, 250],
    },
  );
}

function buildAnnouncementsNotificationContent(
  unseenNotifications: readonly Notification[],
) {
  const [latestNotification] = unseenNotifications;
  const latestAnnouncement = notificationToAnnouncementCard(latestNotification);
  const unseenCount = unseenNotifications.length;
  const isSingleNotification = unseenCount === 1;

  return {
    body: isSingleNotification
      ? latestAnnouncement.title
      : `${latestAnnouncement.title} a další oznámení`,
    data: {
      href: announcementsHref,
    } satisfies AnnouncementNotificationData,
    title: isSingleNotification
      ? "Nové oznámení"
      : `Nová oznámení (${unseenCount})`,
  };
}

async function scheduleAnnouncementsNotificationAsync(
  unseenNotifications: readonly Notification[],
) {
  if (unseenNotifications.length === 0) {
    return;
  }

  await ensureAnnouncementsNotificationChannelAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      ...buildAnnouncementsNotificationContent(unseenNotifications),
      sound: "default",
    },
    trigger:
      Platform.OS === "android"
        ? {
            channelId: announcementsNotificationChannelId,
          }
        : null,
  });
}

async function runAnnouncementsSync(allowLocalNotifications: boolean) {
  const session = await getStoredSession();

  if (!session) {
    return;
  }

  const [seenIds, preferences] = await Promise.all([
    getStoredSeenIds(notificationsSeenNamespace, session.email),
    getStoredNotificationPreferences(session.email),
  ]);
  const syncResult = await syncNotifications({
    authHeaders: { Authorization: session.token },
    email: session.email,
    preferences,
    seenIds,
    stopWhen: ({ nextPage, unseenNotifications }) =>
      unseenNotifications.length > 0 || nextPage === undefined,
  });

  if (seenIds.length === 0) {
    await markNotificationsSeenForSession(
      session,
      syncResult.visibleNotifications,
    );
    return;
  }

  if (syncResult.unseenNotifications.length === 0 || !allowLocalNotifications) {
    return;
  }

  await scheduleAnnouncementsNotificationAsync(syncResult.unseenNotifications);
  await markNotificationsSeenForSession(
    session,
    syncResult.unseenNotifications,
  );
}

async function runAnnouncementsBackgroundTaskAsync() {
  await runAnnouncementsSync(
    await areAnnouncementsNotificationsAllowedAsync(false),
  );
}

if (!TaskManager.isTaskDefined(announcementsBackgroundTaskName)) {
  TaskManager.defineTask(announcementsBackgroundTaskName, async () => {
    try {
      await runAnnouncementsBackgroundTaskAsync();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error("Announcements background task failed.", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function isAnnouncementsBackgroundTaskAvailableAsync() {
  if (isWeb) {
    return false;
  }

  try {
    const [isTaskManagerAvailable, backgroundTaskStatus] = await Promise.all([
      TaskManager.isAvailableAsync(),
      BackgroundTask.getStatusAsync(),
    ]);

    return (
      isTaskManagerAvailable &&
      backgroundTaskStatus === BackgroundTask.BackgroundTaskStatus.Available
    );
  } catch {
    return false;
  }
}

async function registerAnnouncementsBackgroundTaskAsync() {
  if (!(await isAnnouncementsBackgroundTaskAvailableAsync())) {
    return;
  }

  if (
    await TaskManager.isTaskRegisteredAsync(announcementsBackgroundTaskName)
  ) {
    return;
  }

  await BackgroundTask.registerTaskAsync(announcementsBackgroundTaskName, {
    minimumInterval: announcementsBackgroundIntervalMinutes,
  });
}

async function unregisterAnnouncementsBackgroundTaskAsync() {
  if (!(await isAnnouncementsBackgroundTaskAvailableAsync())) {
    return;
  }

  if (
    !(await TaskManager.isTaskRegisteredAsync(announcementsBackgroundTaskName))
  ) {
    return;
  }

  await BackgroundTask.unregisterTaskAsync(announcementsBackgroundTaskName);
}

async function bootstrapAnnouncementsNotificationRuntimeAsync(
  requestPermissions: boolean,
) {
  if (isWeb) {
    return;
  }

  await ensureAnnouncementsNotificationChannelAsync();
  await Promise.all([
    registerAnnouncementsBackgroundTaskAsync(),
    areAnnouncementsNotificationsAllowedAsync(requestPermissions),
  ]);
  await runAnnouncementsSync(false);
}

function getHrefFromNotificationResponse(
  response: Notifications.NotificationResponse,
): AnnouncementHref {
  const data = response.notification.request.content.data as
    | Partial<AnnouncementNotificationData>
    | undefined;

  return data?.href === announcementsHref ? data.href : announcementsHref;
}

function shouldRequestNotificationPermissions(
  previousSession: Session | null | undefined,
  session: Session,
) {
  return (
    previousSession !== undefined && previousSession?.email !== session.email
  );
}

function logAnnouncementsRuntimeError(message: string, error: unknown) {
  console.error(message, error);
}

function runWithLoggedError(promise: Promise<unknown>, message: string) {
  void promise.catch((error) => {
    logAnnouncementsRuntimeError(message, error);
  });
}

export function useAnnouncementsNotificationRuntime(session: Session | null) {
  const router = useRouter();
  const lastHandledNotificationIdRef = useRef<string | null>(null);
  const previousSessionRef = useRef<Session | null | undefined>(undefined);

  useEffect(() => {
    if (isWeb || !session) {
      return;
    }

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const href = getHrefFromNotificationResponse(response);
      const notificationId = response.notification.request.identifier;

      if (lastHandledNotificationIdRef.current === notificationId) {
        return;
      }

      lastHandledNotificationIdRef.current = notificationId;
      router.push(href);
      Notifications.clearLastNotificationResponse();
    };

    const lastNotificationResponse =
      Notifications.getLastNotificationResponse();

    if (lastNotificationResponse) {
      handleResponse(lastNotificationResponse);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleResponse(response);
      },
    );

    return () => {
      subscription.remove();
    };
  }, [router, session]);

  useEffect(() => {
    if (isWeb) {
      return;
    }

    const previousSession = previousSessionRef.current;
    previousSessionRef.current = session;

    if (!session) {
      lastHandledNotificationIdRef.current = null;
      runWithLoggedError(
        unregisterAnnouncementsBackgroundTaskAsync(),
        "Unable to unregister announcements background task.",
      );
      return;
    }

    runWithLoggedError(
      bootstrapAnnouncementsNotificationRuntimeAsync(
        shouldRequestNotificationPermissions(
          previousSession,
          session,
        ),
      ),
      "Unable to bootstrap announcements notification runtime.",
    );
  }, [session]);
}
