import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import { PermissionStatus } from "expo-modules-core";
import * as TaskManager from "expo-task-manager";
import { useRouter } from "expo-router";

import { announcementsHref } from "@/lib/app-routes";
import { stripMarkdown } from "@/lib/markdown";
import { loadPreferences } from "@/lib/notification-preferences";
import {
  seenNs,
  syncNotifications,
  type Notification,
} from "@/lib/notification-sync";
import { getSession, type Session } from "@/lib/session";
import { addSeenIds, dropSeenIds, getSeenState } from "@/lib/seen-state";

const bgTaskName = "cdsf-announcements-background-sync";
const channelId = "cdsf-announcements";
const bgIntervalMins = 15;
const notifColor = "#2457b3";
const previewMaxLen = 140;
const isWeb = Platform.OS === "web";

type NotificationPermissions = Awaited<
  ReturnType<typeof Notifications.getPermissionsAsync>
>;
export type DebugSnapshot = {
  bgStatus: string;
  canAskAgain: boolean;
  allowed: boolean;
  permissionStatus: string;
  platform: typeof Platform.OS;
  seenCount: number;
  taskManager: boolean;
  registered: boolean;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function hasPermission(permissions: NotificationPermissions) {
  return (
    permissions.granted ||
    permissions.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

function bgStatusLabel(
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

function permissionLabel(permissions: NotificationPermissions) {
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

async function requestNotificationsPermission() {
  if (isWeb) {
    return false;
  }

  const current = await Notifications.getPermissionsAsync();

  if (hasPermission(current)) {
    return true;
  }

  if (!current.canAskAgain) {
    return false;
  }

  const next = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return hasPermission(next);
}

async function ensureChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(channelId, {
    name: "Aktuality",
    description: "Upozornění na nová sdělení v části Aktuality.",
    enableLights: true,
    enableVibrate: true,
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: notifColor,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    showBadge: true,
    vibrationPattern: [0, 250, 150, 250],
  });
}

function previewText(value: string, maxLength = previewMaxLen) {
  const preview = stripMarkdown(value)
    .replace(/[>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (preview.length <= maxLength) {
    return preview;
  }
  return `${preview.slice(0, maxLength - 1).trimEnd()}…`;
}

function previewBody(notification: Notification) {
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

function getContent(unseen: readonly Notification[]) {
  const [latest] = unseen;
  const latestTitle = stripMarkdown(latest.caption);
  const count = unseen.length;
  const single = count === 1;
  const preview = previewBody(latest);

  return {
    body: single
      ? preview
      : `${preview} · +${count - 1} další`,
    color: notifColor,
    subtitle: single
      ? "Aktuality ČSTS"
      : latestTitle,
    title: single
      ? latestTitle
      : `Nové aktuality ČSTS (${count})`,
  };
}

async function scheduleNotification(unseen: readonly Notification[]) {
  if (unseen.length === 0) {
    return;
  }
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: getContent(unseen),
    trigger:
      Platform.OS === "android"
        ? {
            channelId,
          }
        : null,
  });
}

export async function runWorkerForTest() {
  if (isWeb) {
    return false;
  }

  return BackgroundTask.triggerTaskWorkerForTestingAsync();
}

export async function replayLatestForTest() {
  if (isWeb) {
    return false;
  }

  const session = await getSession();
  if (!session) {
    return false;
  }

  const [preferences, seen] = await Promise.all([
    loadPreferences(session.email),
    getSeenState(seenNs, session.email),
  ]);
  const result = await syncNotifications({
    authHeaders: { Authorization: session.token },
    email: session.email,
    maxPages: 3,
    persistToCache: false,
    preferences,
    seenIds: seen.ids,
    stopWhen: ({ nextPage, visible }) =>
      visible.length > 0 || nextPage === undefined,
  });
  const latest = result.visible[0];

  if (!latest) {
    return false;
  }

  await dropSeenIds(seenNs, [latest.id.toString()], session.email);

  await runBgTask();
  return true;
}

async function runSync(allowLocalNotifications: boolean) {
  const session = await getSession();
  if (!session) {
    return;
  }

  const [seen, preferences] = await Promise.all([
    getSeenState(seenNs, session.email),
    loadPreferences(session.email),
  ]);
  const result = await syncNotifications({
    authHeaders: { Authorization: session.token },
    email: session.email,
    preferences,
    seenIds: seen.ids,
    stopWhen: ({ nextPage, unseen }) =>
      unseen.length > 0 || nextPage === undefined,
  });
  const toMarkSeen = seen.initialized ? result.unseen : result.visible;

  if (toMarkSeen.length === 0) {
    return;
  }

  if (seen.initialized) {
    if (!allowLocalNotifications) {
      return;
    }

    await scheduleNotification(toMarkSeen);
  }

  await addSeenIds(
    seenNs,
    toMarkSeen.map((notification) => notification.id.toString()),
    session.email,
  );
}

async function runBgTask() {
  await runSync(
    isWeb ? false : hasPermission(await Notifications.getPermissionsAsync()),
  );
}

if (!TaskManager.isTaskDefined(bgTaskName)) {
  TaskManager.defineTask(bgTaskName, async () => {
    try {
      await runBgTask();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error("Announcements background task failed.", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function isBgTaskAvailable() {
  if (isWeb) {
    return false;
  }

  try {
    const [taskManager, status] = await Promise.all([
      TaskManager.isAvailableAsync(),
      BackgroundTask.getStatusAsync(),
    ]);

    return taskManager && status === BackgroundTask.BackgroundTaskStatus.Available;
  } catch {
    return false;
  }
}

async function registerBgTask() {
  if (!(await isBgTaskAvailable())) {
    return;
  }

  if (await TaskManager.isTaskRegisteredAsync(bgTaskName)) {
    return;
  }

  await BackgroundTask.registerTaskAsync(bgTaskName, {
    minimumInterval: bgIntervalMins,
  });
}

async function unregisterBgTask() {
  if (!(await isBgTaskAvailable())) {
    return;
  }

  if (!(await TaskManager.isTaskRegisteredAsync(bgTaskName))) {
    return;
  }

  await BackgroundTask.unregisterTaskAsync(bgTaskName);
}

export async function getDebugSnapshot(
  email?: string | null,
): Promise<DebugSnapshot> {
  const seen = email
    ? await getSeenState(seenNs, email)
    : { ids: new Set<string>(), initialized: false };

  if (isWeb) {
    return {
      bgStatus: "Web",
      canAskAgain: false,
      allowed: false,
      permissionStatus: "Nepodporováno",
      platform: Platform.OS,
      seenCount: seen.ids.size,
      taskManager: false,
      registered: false,
    };
  }

  const permissions = await Notifications.getPermissionsAsync();
  let taskManager = false;
  let registered = false;
  let bgStatus = "Neznámé";

  try {
    const [isAvailable, status] = await Promise.all([
      TaskManager.isAvailableAsync(),
      BackgroundTask.getStatusAsync(),
    ]);

    taskManager = isAvailable;
    bgStatus = bgStatusLabel(status);

    if (isAvailable) {
      registered = await TaskManager.isTaskRegisteredAsync(bgTaskName);
    }
  } catch {
    bgStatus = "Nedostupné";
  }

  return {
    bgStatus,
    canAskAgain: permissions.canAskAgain,
    allowed: hasPermission(permissions),
    permissionStatus: permissionLabel(permissions),
    platform: Platform.OS,
    seenCount: seen.ids.size,
    taskManager,
    registered,
  };
}

async function bootstrapRuntime(requestPermissions: boolean) {
  if (isWeb) {
    return;
  }

  await ensureChannel();

  if (requestPermissions) {
    await requestNotificationsPermission();
  }

  await registerBgTask();
  await runSync(false);
}

export function useNotificationRuntime(session: Session | null) {
  const router = useRouter();
  const lastHandledIdRef = useRef<string | null>(null);
  const prevSessionRef = useRef<Session | null | undefined>(undefined);

  useEffect(() => {
    if (isWeb || !session) {
      return;
    }

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;

      if (lastHandledIdRef.current === id) {
        return;
      }

      lastHandledIdRef.current = id;
      router.push(announcementsHref);
      Notifications.clearLastNotificationResponse();
    };

    const lastResponse = Notifications.getLastNotificationResponse();

    if (lastResponse) {
      handleResponse(lastResponse);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );

    return () => {
      subscription.remove();
    };
  }, [router, session]);

  useEffect(() => {
    if (isWeb) {
      return;
    }

    const prevSession = prevSessionRef.current;
    prevSessionRef.current = session;

    if (!session) {
      lastHandledIdRef.current = null;
      void unregisterBgTask().catch((error) => {
        console.error(
          "Unable to unregister announcements background task.",
          error,
        );
      });
      return;
    }

    const requestPermissions = prevSession?.email !== session.email;

    void bootstrapRuntime(requestPermissions).catch((error) => {
      console.error(
        "Unable to bootstrap announcements notification runtime.",
        error,
      );
    });
  }, [session]);
}
