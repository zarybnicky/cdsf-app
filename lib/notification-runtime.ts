import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import { PermissionStatus } from "expo-modules-core";
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
import {
  getStoredSeenState,
  markSeenIds,
  removeSeenIds,
} from "@/lib/seen-state";

export const announcementsBackgroundTaskName =
  "cdsf-announcements-background-sync";
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
export type AnnouncementsNotificationDebugSnapshot = {
  backgroundStatusLabel: string;
  canAskAgain: boolean;
  notificationsAllowed: boolean;
  permissionStatusLabel: string;
  platform: typeof Platform.OS;
  seenCount: number;
  taskManagerAvailable: boolean;
  taskRegistered: boolean;
};

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

function getBackgroundTaskStatusLabel(
  status: BackgroundTask.BackgroundTaskStatus | null,
) {
  if (status === BackgroundTask.BackgroundTaskStatus.Available) {
    return "Dostupné";
  }

  if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
    return "Omezené";
  }

  return "Neznámé";
}

function getPermissionStatusLabel(permissions: NotificationPermissions) {
  if (permissions.granted) {
    return "Povoleno";
  }

  if (
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return "Prozatímně povoleno";
  }

  if (
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  ) {
    return "Dočasně povoleno";
  }

  if (permissions.status === PermissionStatus.DENIED) {
    return "Zakázáno";
  }

  if (permissions.status === PermissionStatus.UNDETERMINED) {
    return "Neurčeno";
  }

  return "Nepovoleno";
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

async function areAnnouncementsNotificationsAllowedAsync(
  requestIfNeeded: boolean,
) {
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
      vibrationPattern: [0, 250, 150, 250],
    },
  );
}

export async function requestAnnouncementsNotificationPermissionsAsync() {
  if (isWeb) {
    return false;
  }

  await ensureAnnouncementsNotificationChannelAsync();
  return areAnnouncementsNotificationsAllowedAsync(true);
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
    },
    trigger:
      Platform.OS === "android"
        ? {
            channelId: announcementsNotificationChannelId,
          }
        : null,
  });
}

export async function scheduleSampleAnnouncementsNotificationAsync() {
  if (isWeb) {
    return false;
  }

  await ensureAnnouncementsNotificationChannelAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      body: "Otevřením přejdete do části Aktuality.",
      data: {
        href: announcementsHref,
      } satisfies AnnouncementNotificationData,
      title: "Testovací oznámení",
    },
    trigger:
      Platform.OS === "android"
        ? {
            channelId: announcementsNotificationChannelId,
          }
        : null,
  });

  return true;
}

export async function triggerAnnouncementsBackgroundTaskForTestingAsync() {
  if (isWeb) {
    return false;
  }

  return BackgroundTask.triggerTaskWorkerForTestingAsync();
}

export async function replayLatestAnnouncementThroughBackgroundTaskForTestingAsync() {
  if (isWeb) {
    return false;
  }

  const session = await getStoredSession();

  if (!session) {
    return false;
  }

  const [preferences, seenState] = await Promise.all([
    getStoredNotificationPreferences(session.email),
    getStoredSeenState(notificationsSeenNamespace, session.email),
  ]);
  const syncResult = await syncNotifications({
    authHeaders: { Authorization: session.token },
    email: session.email,
    maxPages: 3,
    persistToCache: false,
    preferences,
    seenIds: seenState.ids,
    stopWhen: ({ nextPage, visibleNotifications }) =>
      visibleNotifications.length > 0 || nextPage === undefined,
  });
  const latestVisibleNotification = syncResult.visibleNotifications[0];

  if (!latestVisibleNotification) {
    return false;
  }

  await removeSeenIds(
    notificationsSeenNamespace,
    [getNotificationSeenId(latestVisibleNotification)],
    session.email,
  );

  return triggerAnnouncementsBackgroundTaskForTestingAsync();
}

async function runAnnouncementsSync(allowLocalNotifications: boolean) {
  const session = await getStoredSession();

  if (!session) {
    return;
  }

  const [seenState, preferences] = await Promise.all([
    getStoredSeenState(notificationsSeenNamespace, session.email),
    getStoredNotificationPreferences(session.email),
  ]);
  const seenIds = seenState.ids;
  const syncResult = await syncNotifications({
    authHeaders: { Authorization: session.token },
    email: session.email,
    preferences,
    seenIds,
    stopWhen: ({ nextPage, unseenNotifications }) =>
      unseenNotifications.length > 0 || nextPage === undefined,
  });

  if (!seenState.initialized) {
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

export async function getAnnouncementsNotificationDebugSnapshotAsync(
  email?: string | null,
): Promise<AnnouncementsNotificationDebugSnapshot> {
  const seenState = email
    ? await getStoredSeenState(notificationsSeenNamespace, email)
    : { ids: [], initialized: false };
  const seenIds = seenState.ids;

  if (isWeb) {
    return {
      backgroundStatusLabel: "Web",
      canAskAgain: false,
      notificationsAllowed: false,
      permissionStatusLabel: "Nepodporováno",
      platform: Platform.OS,
      seenCount: seenIds.length,
      taskManagerAvailable: false,
      taskRegistered: false,
    };
  }

  const permissions = await Notifications.getPermissionsAsync();
  let taskManagerAvailable = false;
  let taskRegistered = false;
  let backgroundStatusLabel = "Neznámé";

  try {
    const [isAvailable, backgroundTaskStatus] = await Promise.all([
      TaskManager.isAvailableAsync(),
      BackgroundTask.getStatusAsync(),
    ]);

    taskManagerAvailable = isAvailable;
    backgroundStatusLabel = getBackgroundTaskStatusLabel(backgroundTaskStatus);

    if (isAvailable) {
      taskRegistered = await TaskManager.isTaskRegisteredAsync(
        announcementsBackgroundTaskName,
      );
    }
  } catch {
    backgroundStatusLabel = "Nedostupné";
  }

  return {
    backgroundStatusLabel,
    canAskAgain: permissions.canAskAgain,
    notificationsAllowed: allowsNotifications(permissions),
    permissionStatusLabel: getPermissionStatusLabel(permissions),
    platform: Platform.OS,
    seenCount: seenIds.length,
    taskManagerAvailable,
    taskRegistered,
  };
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
        shouldRequestNotificationPermissions(previousSession, session),
      ),
      "Unable to bootstrap announcements notification runtime.",
    );
  }, [session]);
}
