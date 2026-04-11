import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { useRouter } from 'expo-router';

import { notificationToAnnouncementCard } from '@/lib/cdsf-formatters';
import { getStoredNotificationPreferences } from '@/lib/notification-preferences';
import {
  getNotificationSeenId,
  notificationsSeenNamespace,
  syncNotifications,
  type Notification,
} from '@/lib/notification-sync';
import type { Session } from '@/lib/session';
import { getStoredSession } from '@/lib/session';
import { getStoredSeenIds, markSeenIds } from '@/lib/seen-state';

const announcementsBackgroundTaskName = 'cdsf-announcements-background-sync';
const announcementsNotificationChannelId = 'cdsf-announcements';
const announcementsBackgroundIntervalMinutes = 15;
const announcementsHref = '/announcements';

type AnnouncementHref = typeof announcementsHref;
type AnnouncementNotificationData = {
  href: AnnouncementHref;
  latestNotificationId: string;
  unseenCount: number;
};
type NotificationPermissions = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function allowsNotifications(
  permissions: NotificationPermissions,
) {
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function areAnnouncementsNotificationsAllowedAsync({
  requestIfNeeded,
}: {
  requestIfNeeded: boolean;
}) {
  if (Platform.OS === 'web') {
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
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(announcementsNotificationChannelId, {
    name: 'Announcements',
    description: 'Background alerts for new CDSF announcements.',
    enableLights: true,
    enableVibrate: true,
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#2f67ce',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    sound: 'default',
    vibrationPattern: [0, 250, 150, 250],
  });
}

function buildAnnouncementsNotificationContent(unseenNotifications: Notification[]) {
  const [latestNotification] = unseenNotifications;
  const latestAnnouncement = notificationToAnnouncementCard(latestNotification);
  const unseenCount = unseenNotifications.length;
  const isSingleNotification = unseenCount === 1;

  return {
    body: isSingleNotification
      ? latestAnnouncement.title
      : `${latestAnnouncement.title} a ${unseenCount - 1} dalsi`,
    data: {
      href: announcementsHref,
      latestNotificationId: latestNotification.id.toString(),
      unseenCount,
    } satisfies AnnouncementNotificationData,
    title: isSingleNotification ? 'Nova aktualita' : `Nove aktuality (${unseenCount})`,
  };
}

async function scheduleAnnouncementsNotificationAsync(unseenNotifications: Notification[]) {
  if (unseenNotifications.length === 0) {
    return null;
  }

  await ensureAnnouncementsNotificationChannelAsync();

  return Notifications.scheduleNotificationAsync({
    content: {
      ...buildAnnouncementsNotificationContent(unseenNotifications),
      sound: 'default',
    },
    trigger:
      Platform.OS === 'android'
        ? {
            channelId: announcementsNotificationChannelId,
          }
        : null,
  });
}

type RunAnnouncementsSyncOptions = {
  allowLocalNotifications: boolean;
};

export async function runAnnouncementsSync({
  allowLocalNotifications,
}: RunAnnouncementsSyncOptions) {
  const session = await getStoredSession();

  if (!session) {
    return {
      deliveredNotificationId: null,
      seededSeenState: false,
      unseenCount: 0,
    };
  }

  const seenIds = await getStoredSeenIds(notificationsSeenNamespace, session.email);
  const notificationPreferences = await getStoredNotificationPreferences(session.email);
  const syncResult = await syncNotifications({
    authHeaders: {
      Authorization: session.token,
    },
    email: session.email,
    preferences: notificationPreferences,
    stopWhen: ({ nextPage, unseenNotifications }) =>
      unseenNotifications.length > 0 || nextPage === undefined,
  });

  if (seenIds.length === 0) {
    if (syncResult.visibleNotifications.length > 0) {
      await markSeenIds(
        notificationsSeenNamespace,
        syncResult.visibleNotifications.map(getNotificationSeenId),
        session.email,
      );
    }

    return {
      deliveredNotificationId: null,
      seededSeenState: true,
      unseenCount: syncResult.unseenNotifications.length,
    };
  }

  if (syncResult.unseenNotifications.length === 0) {
    return {
      deliveredNotificationId: null,
      seededSeenState: false,
      unseenCount: 0,
    };
  }

  if (!allowLocalNotifications) {
    return {
      deliveredNotificationId: null,
      seededSeenState: false,
      unseenCount: syncResult.unseenNotifications.length,
    };
  }

  const deliveredNotificationId = await scheduleAnnouncementsNotificationAsync(
    syncResult.unseenNotifications,
  );

  await markSeenIds(
    notificationsSeenNamespace,
    syncResult.unseenNotifications.map(getNotificationSeenId),
    session.email,
  );

  return {
    deliveredNotificationId,
    seededSeenState: false,
    unseenCount: syncResult.unseenNotifications.length,
  };
}

async function runAnnouncementsBackgroundTaskAsync() {
  const allowLocalNotifications = await areAnnouncementsNotificationsAllowedAsync({
    requestIfNeeded: false,
  });

  await runAnnouncementsSync({ allowLocalNotifications });
}

if (!TaskManager.isTaskDefined(announcementsBackgroundTaskName)) {
  TaskManager.defineTask(announcementsBackgroundTaskName, async () => {
    try {
      await runAnnouncementsBackgroundTaskAsync();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error('Announcements background task failed.', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function isAnnouncementsBackgroundTaskAvailableAsync() {
  if (Platform.OS === 'web') {
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

export async function registerAnnouncementsBackgroundTaskAsync() {
  if (!(await isAnnouncementsBackgroundTaskAvailableAsync())) {
    return false;
  }

  if (await TaskManager.isTaskRegisteredAsync(announcementsBackgroundTaskName)) {
    return true;
  }

  await BackgroundTask.registerTaskAsync(announcementsBackgroundTaskName, {
    minimumInterval: announcementsBackgroundIntervalMinutes,
  });

  return true;
}

export async function unregisterAnnouncementsBackgroundTaskAsync() {
  if (!(await isAnnouncementsBackgroundTaskAvailableAsync())) {
    return;
  }

  if (!(await TaskManager.isTaskRegisteredAsync(announcementsBackgroundTaskName))) {
    return;
  }

  await BackgroundTask.unregisterTaskAsync(announcementsBackgroundTaskName);
}

type BootstrapAnnouncementsNotificationRuntimeOptions = {
  requestPermissions: boolean;
};

export async function bootstrapAnnouncementsNotificationRuntimeAsync({
  requestPermissions,
}: BootstrapAnnouncementsNotificationRuntimeOptions) {
  if (Platform.OS === 'web') {
    return {
      backgroundTaskRegistered: false,
      notificationsAllowed: false,
    };
  }

  await ensureAnnouncementsNotificationChannelAsync();
  const [backgroundTaskRegistered, notificationsAllowed] = await Promise.all([
    registerAnnouncementsBackgroundTaskAsync(),
    areAnnouncementsNotificationsAllowedAsync({
      requestIfNeeded: requestPermissions,
    }),
  ]);
  await runAnnouncementsSync({ allowLocalNotifications: false });

  return {
    backgroundTaskRegistered,
    notificationsAllowed,
  };
}

function getHrefFromNotificationResponse(
  response: Notifications.NotificationResponse,
): AnnouncementHref {
  const data = response.notification.request.content.data as
    | Partial<AnnouncementNotificationData>
    | undefined;

  if (data?.href === announcementsHref) {
    return announcementsHref;
  }

  return announcementsHref;
}

export function useAnnouncementsNotificationRuntime(session: Session | null) {
  const router = useRouter();
  const lastHandledNotificationIdRef = useRef<string | null>(null);
  const previousSessionRef = useRef<Session | null | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS === 'web' || !session) {
      return;
    }

    let isMounted = true;

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const href = getHrefFromNotificationResponse(response);
      const notificationId = response.notification.request.identifier;

      if (!href || lastHandledNotificationIdRef.current === notificationId) {
        return;
      }

      lastHandledNotificationIdRef.current = notificationId;
      router.push(href);
      Notifications.clearLastNotificationResponse();
    };

    const lastNotificationResponse = Notifications.getLastNotificationResponse();

    if (lastNotificationResponse) {
      handleResponse(lastNotificationResponse);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isMounted) {
        return;
      }

      handleResponse(response);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [router, session]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const previousSession = previousSessionRef.current;
    previousSessionRef.current = session;

    if (!session) {
      lastHandledNotificationIdRef.current = null;
      void unregisterAnnouncementsBackgroundTaskAsync().catch((error) => {
        console.error('Unable to unregister announcements background task.', error);
      });
      return;
    }

    const shouldRequestPermissions =
      previousSession !== undefined && previousSession?.email !== session.email;

    void bootstrapAnnouncementsNotificationRuntimeAsync({
      requestPermissions: shouldRequestPermissions,
    }).catch((error) => {
      console.error('Unable to bootstrap announcements notification runtime.', error);
    });
  }, [session]);
}
