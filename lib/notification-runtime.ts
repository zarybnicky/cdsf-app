import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import { PermissionStatus } from "expo-modules-core";
import * as TaskManager from "expo-task-manager";
import { useRouter, type Href } from "expo-router";
import { useAtomValue } from "jotai";

import { appStore } from "@/lib/app-store";
import {
  ensureNotificationChannels,
  replayLatestNotificationForTest,
  runNotificationSyncs,
} from "@/lib/notification-worker";
import { currentSessionAtom } from "@/lib/session";
import { announcementsSeenAtom, resultsSeenAtom } from "@/lib/seen-state";

const bgTaskName = "cdsf-announcements-background-sync";
const bgIntervalMins = 15;
const isWeb = Platform.OS === "web";

type NotificationTarget = "announcements" | "competition-results";

type NotificationPermissions = Awaited<
  ReturnType<typeof Notifications.getPermissionsAsync>
>;

export type DebugSnapshot = {
  announcementLatestMs: number | null;
  announcementLatestIds: number;
  bgStatus: string;
  canAskAgain: boolean;
  allowed: boolean;
  permissionStatus: string;
  platform: typeof Platform.OS;
  resultsSeenCount: number;
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

const targetRoutes = {
  announcements: "/announcements",
  "competition-results": "/competitions/results",
} as const satisfies Record<NotificationTarget, Href>;

function hasPermission(permissions: NotificationPermissions) {
  return (
    permissions.granted ||
    permissions.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function canSendLocalNotifications() {
  return !isWeb && hasPermission(await Notifications.getPermissionsAsync());
}

function getNotificationTarget(data: unknown): NotificationTarget {
  return (
    data &&
    typeof data === "object" &&
    "target" in data &&
    data.target === "competition-results"
  )
    ? "competition-results"
    : "announcements";
}

function bgStatusLabel(status: BackgroundTask.BackgroundTaskStatus | null) {
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

  return replayLatestNotificationForTest(await canSendLocalNotifications());
}

if (!TaskManager.isTaskDefined(bgTaskName)) {
  TaskManager.defineTask(bgTaskName, async () => {
    try {
      await runNotificationSyncs(await canSendLocalNotifications());
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error("Notifications background task failed.", error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

async function getBgTaskState() {
  if (isWeb) {
    return null;
  }

  try {
    const [taskManager, status] = await Promise.all([
      TaskManager.isAvailableAsync(),
      BackgroundTask.getStatusAsync(),
    ]);

    return { status, taskManager };
  } catch {
    return null;
  }
}

async function setBgTaskRegistered(registered: boolean) {
  const state = await getBgTaskState();

  if (
    !state?.taskManager ||
    state.status !== BackgroundTask.BackgroundTaskStatus.Available
  ) {
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(bgTaskName);

  if (registered === isRegistered) {
    return;
  }

  if (!registered) {
    await BackgroundTask.unregisterTaskAsync(bgTaskName);
    return;
  }

  await BackgroundTask.registerTaskAsync(bgTaskName, {
    minimumInterval: bgIntervalMins,
  });
}

export async function getDebugSnapshot(): Promise<DebugSnapshot> {
  const [announcementsSeen, resultsSeen] = await Promise.all([
    appStore.get(announcementsSeenAtom),
    appStore.get(resultsSeenAtom),
  ]);
  const state = {
    announcementLatestMs: announcementsSeen.latestCreatedMs,
    announcementLatestIds: announcementsSeen.latestIds.length,
    platform: Platform.OS,
    resultsSeenCount: resultsSeen.ids.length,
  };

  if (isWeb) {
    return {
      ...state,
      bgStatus: "Web",
      canAskAgain: false,
      allowed: false,
      permissionStatus: "Nepodporováno",
      taskManager: false,
      registered: false,
    };
  }

  const permissions = await Notifications.getPermissionsAsync();
  const bgTaskState = await getBgTaskState();
  const taskManager = bgTaskState?.taskManager ?? false;
  const bgStatus = bgTaskState ? bgStatusLabel(bgTaskState.status) : "Nedostupné";
  const registered = taskManager
    ? await TaskManager.isTaskRegisteredAsync(bgTaskName)
    : false;

  return {
    ...state,
    bgStatus,
    canAskAgain: permissions.canAskAgain,
    allowed: hasPermission(permissions),
    permissionStatus: permissionLabel(permissions),
    taskManager,
    registered,
  };
}

async function bootstrapRuntime(requestPermissions: boolean) {
  if (isWeb) {
    return;
  }

  await ensureNotificationChannels();

  if (requestPermissions) {
    await requestNotificationsPermission();
  }

  await setBgTaskRegistered(true);
  await runNotificationSyncs(false);
}

export function useNotificationRuntime(enabled: boolean) {
  const router = useRouter();
  const session = useAtomValue(currentSessionAtom);
  const lastHandledIdRef = useRef<string | null>(null);
  const prevEmailRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled || isWeb || !session) {
      return;
    }

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;

      if (lastHandledIdRef.current === id) {
        return;
      }

      lastHandledIdRef.current = id;
      router.push(
        targetRoutes[getNotificationTarget(response.notification.request.content.data)],
      );
      Notifications.clearLastNotificationResponse();
    };

    const lastResponse = Notifications.getLastNotificationResponse();

    if (lastResponse) {
      handleResponse(lastResponse);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      subscription.remove();
    };
  }, [enabled, router, session]);

  useEffect(() => {
    if (!enabled || isWeb) {
      return;
    }

    const prevEmail = prevEmailRef.current;
    const email = session?.email ?? null;
    prevEmailRef.current = email;

    if (!session) {
      lastHandledIdRef.current = null;
      void setBgTaskRegistered(false).catch((error) => {
        console.error(
          "Unable to unregister notifications background task.",
          error,
        );
      });
      return;
    }

    const requestPermissions = prevEmail !== email;

    void bootstrapRuntime(requestPermissions).catch((error) => {
      console.error("Unable to bootstrap notifications runtime.", error);
    });
  }, [enabled, session]);
}
