import { useEffect, useRef } from "react";
import { Platform } from "react-native";

import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import { PermissionStatus } from "expo-modules-core";
import * as TaskManager from "expo-task-manager";
import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { appStore } from "@/lib/app-store";
import {
  type PublishedCompetitionResult,
  syncCompetitionResults,
} from "@/lib/competition-results-sync";
import { getAgeLabel } from "@/lib/cdsf";
import { stripMarkdown } from "@/lib/markdown";
import { notificationPreferencesAtom } from "@/lib/notification-preferences";
import { type Notification, syncNotifications } from "@/lib/notification-sync";
import { sessionAtom, sessionValueAtom, type Session } from "@/lib/session";
import {
  addSeenIds,
  announcementsSeenStateAtom,
  competitionResultsSeenStateAtom,
  dropSeenIds,
  initializeSeenState,
} from "@/lib/seen-state";

const bgTaskName = "cdsf-announcements-background-sync";
const announcementsChannelId = "cdsf-announcements";
const resultsChannelId = "cdsf-results";
const bgIntervalMins = 15;
const notifColor = "#2457b3";
const previewMaxLen = 140;
const isWeb = Platform.OS === "web";

type NotificationTarget = "announcements" | "competition-results";

type NotificationPermissions = Awaited<
  ReturnType<typeof Notifications.getPermissionsAsync>
>;
export type DebugSnapshot = {
  announcementsSeenCount: number;
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

function hasPermission(permissions: NotificationPermissions) {
  return (
    permissions.granted ||
    permissions.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
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

async function ensureAnnouncementsChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(announcementsChannelId, {
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

async function ensureResultsChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(resultsChannelId, {
    name: "Výsledky",
    description: "Upozornění na nově zveřejněné výsledky soutěží.",
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
    body: single ? preview : `${preview} · +${count - 1} další`,
    color: notifColor,
    subtitle: single ? "Aktuality ČSTS" : latestTitle,
    title: single ? latestTitle : `Nové aktuality ČSTS (${count})`,
  };
}

async function scheduleAnnouncementsNotification(
  unseen: readonly Notification[],
) {
  if (unseen.length === 0) {
    return;
  }
  await ensureAnnouncementsChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      ...getContent(unseen),
      data: {
        target: "announcements" satisfies NotificationTarget,
      },
    },
    trigger:
      Platform.OS === "android"
        ? {
            channelId: announcementsChannelId,
          }
        : null,
  });
}

function formatCompetitionClass(result: PublishedCompetitionResult) {
  const classLabel = result.competition.class;

  if (
    !classLabel ||
    classLabel === "Open" ||
    classLabel ===
      ("Unknown" as PublishedCompetitionResult["competition"]["class"])
  ) {
    return undefined;
  }

  return classLabel;
}

function formatCompetitionGrade(result: PublishedCompetitionResult) {
  switch (result.competition.grade) {
    case "Championship":
      return "MČR";
    case "League":
      return "TL";
    case "SuperLeague":
      return "STL";
    default:
      return undefined;
  }
}

function formatCompetitionDiscipline(result: PublishedCompetitionResult) {
  switch (result.competition.discipline) {
    case "Standard":
      return "STT";
    case "Latin":
      return "LAT";
    case "TenDances":
      return "10T";
    case "Standard+Latin":
      return "STT + LAT";
    case "SingleOfTenDances":
      return "Single 10T";
    case "FreeStyle":
      return "Freestyle";
    default:
      return result.competition.discipline;
  }
}

function formatCompetitionPlacement(result: PublishedCompetitionResult) {
  const { ranking, rankingTo } = result.competition;

  if (typeof ranking !== "number") {
    return "Výsledek byl zveřejněn.";
  }

  if (typeof rankingTo === "number" && rankingTo > ranking) {
    return `${ranking}.-${rankingTo}. místo`;
  }

  return `${ranking}. místo`;
}

function formatCompetitionLabel(result: PublishedCompetitionResult) {
  const label = [
    formatCompetitionGrade(result),
    getAgeLabel(result.competition.age),
    formatCompetitionClass(result),
    formatCompetitionDiscipline(result),
  ]
    .filter(Boolean)
    .join(" ");

  return label || "Výsledek soutěže";
}

function getResultsContent(unseen: readonly PublishedCompetitionResult[]) {
  const [latest] = unseen;
  const count = unseen.length;
  const single = count === 1;
  const resultSummary = `${formatCompetitionLabel(latest)} · ${formatCompetitionPlacement(
    latest,
  )}`;

  return {
    body: single ? resultSummary : `${resultSummary} · +${count - 1} další`,
    color: notifColor,
    subtitle: single ? "Výsledky soutěží" : latest.event.eventName,
    title: single ? latest.event.eventName : `Nové výsledky soutěží (${count})`,
  };
}

async function scheduleResultsNotification(
  unseen: readonly PublishedCompetitionResult[],
) {
  if (unseen.length === 0) {
    return;
  }

  await ensureResultsChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      ...getResultsContent(unseen),
      data: {
        target: "competition-results" satisfies NotificationTarget,
      },
    },
    trigger:
      Platform.OS === "android"
        ? {
            channelId: resultsChannelId,
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

  const session = await appStore.get(sessionAtom);
  if (!session) {
    return false;
  }

  const [preferences, { ids: seenIds }] = await Promise.all([
    appStore.get(notificationPreferencesAtom),
    appStore.get(announcementsSeenStateAtom),
  ]);
  const result = await syncNotifications({
    authHeaders: { Authorization: session.token },
    maxPages: 3,
    preferences,
    seenIds,
    stopWhen: ({ nextPage, visible }) =>
      visible.length > 0 || nextPage === undefined,
  });
  const latest = result.visible[0];

  if (!latest) {
    return false;
  }

  await appStore.set(
    announcementsSeenStateAtom,
    dropSeenIds([latest.id.toString()]),
  );

  await runBgTask();
  return true;
}

async function runAnnouncementsSync(allowLocalNotifications: boolean) {
  const session = await appStore.get(sessionAtom);
  if (!session) {
    return;
  }

  const [seen, preferences] = await Promise.all([
    appStore.get(announcementsSeenStateAtom),
    appStore.get(notificationPreferencesAtom),
  ]);
  const result = await syncNotifications({
    authHeaders: { Authorization: session.token },
    preferences,
    seenIds: seen.ids,
    stopWhen: ({ nextPage, unseen }) =>
      unseen.length > 0 || nextPage === undefined,
  });
  const toMarkSeen = seen.initialized ? result.unseen : result.visible;

  if (toMarkSeen.length === 0) {
    if (!seen.initialized) {
      await appStore.set(announcementsSeenStateAtom, initializeSeenState());
    }

    return;
  }

  if (seen.initialized) {
    if (!allowLocalNotifications) {
      return;
    }

    await scheduleAnnouncementsNotification(toMarkSeen);
  }

  await appStore.set(
    announcementsSeenStateAtom,
    addSeenIds(toMarkSeen.map((notification) => notification.id.toString())),
  );
}

async function runCompetitionResultsSync(allowLocalNotifications: boolean) {
  const session = await appStore.get(sessionAtom);
  if (!session) {
    return;
  }

  const seen = await appStore.get(competitionResultsSeenStateAtom);
  const result = await syncCompetitionResults({
    authHeaders: { Authorization: session.token },
    maxPages: seen.initialized ? 3 : Number.POSITIVE_INFINITY,
    seenIds: seen.ids,
    stopWhen: seen.initialized
      ? ({ nextPage, unseen }) => unseen.length > 0 || nextPage === undefined
      : ({ nextPage }) => nextPage === undefined,
  });
  const toMarkSeen = seen.initialized ? result.unseen : result.results;

  if (toMarkSeen.length === 0) {
    if (!seen.initialized) {
      await appStore.set(
        competitionResultsSeenStateAtom,
        initializeSeenState(),
      );
    }

    return;
  }

  if (seen.initialized) {
    if (!allowLocalNotifications) {
      return;
    }

    await scheduleResultsNotification(toMarkSeen);
  }

  await appStore.set(
    competitionResultsSeenStateAtom,
    addSeenIds(toMarkSeen.map((result) => result.id)),
  );
}

async function runAllSyncs(allowLocalNotifications: boolean) {
  const errors: unknown[] = [];

  try {
    await runAnnouncementsSync(allowLocalNotifications);
  } catch (error) {
    console.error("Announcements sync failed.", error);
    errors.push(error);
  }

  try {
    await runCompetitionResultsSync(allowLocalNotifications);
  } catch (error) {
    console.error("Competition results sync failed.", error);
    errors.push(error);
  }

  if (errors.length > 0) {
    throw errors[0];
  }
}

async function runBgTask() {
  await runAllSyncs(
    isWeb ? false : hasPermission(await Notifications.getPermissionsAsync()),
  );
}

if (!TaskManager.isTaskDefined(bgTaskName)) {
  TaskManager.defineTask(bgTaskName, async () => {
    try {
      await runBgTask();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.error("Notifications background task failed.", error);
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

    return (
      taskManager && status === BackgroundTask.BackgroundTaskStatus.Available
    );
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

export async function getDebugSnapshot(): Promise<DebugSnapshot> {
  const [announcementsSeen, resultsSeen] = await Promise.all([
    appStore.get(announcementsSeenStateAtom),
    appStore.get(competitionResultsSeenStateAtom),
  ]);

  if (isWeb) {
    return {
      announcementsSeenCount: announcementsSeen.ids.size,
      bgStatus: "Web",
      canAskAgain: false,
      allowed: false,
      permissionStatus: "Nepodporováno",
      platform: Platform.OS,
      resultsSeenCount: resultsSeen.ids.size,
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
    announcementsSeenCount: announcementsSeen.ids.size,
    bgStatus,
    canAskAgain: permissions.canAskAgain,
    allowed: hasPermission(permissions),
    permissionStatus: permissionLabel(permissions),
    platform: Platform.OS,
    resultsSeenCount: resultsSeen.ids.size,
    taskManager,
    registered,
  };
}

async function bootstrapRuntime(requestPermissions: boolean) {
  if (isWeb) {
    return;
  }

  await Promise.all([ensureAnnouncementsChannel(), ensureResultsChannel()]);

  if (requestPermissions) {
    await requestNotificationsPermission();
  }

  await registerBgTask();
  await runAllSyncs(false);
}

export function useNotificationRuntime(enabled: boolean) {
  const router = useRouter();
  const session = useAtomValue(sessionValueAtom);
  const lastHandledIdRef = useRef<string | null>(null);
  const prevSessionRef = useRef<Session | null | undefined>(undefined);

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
      const target = (() => {
        const data = response.notification.request.content.data;

        if (
          data &&
          typeof data === "object" &&
          "target" in data &&
          data.target === "competition-results"
        ) {
          return "competition-results" as const;
        }

        return "announcements" as const;
      })();

      router.push(
        target === "competition-results"
          ? "/competitions?tab=results"
          : "/announcements",
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

    const prevSession = prevSessionRef.current;
    prevSessionRef.current = session;

    if (!session) {
      lastHandledIdRef.current = null;
      void unregisterBgTask().catch((error) => {
        console.error(
          "Unable to unregister notifications background task.",
          error,
        );
      });
      return;
    }

    const requestPermissions = prevSession?.email !== session.email;

    void bootstrapRuntime(requestPermissions).catch((error) => {
      console.error("Unable to bootstrap notifications runtime.", error);
    });
  }, [enabled, session]);
}
