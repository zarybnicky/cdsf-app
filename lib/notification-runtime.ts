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
import { currentSessionAtom, sessionAtom, type Session } from "@/lib/session";
import {
  announcementsSeenAtom,
  getAnnouncementCreatedMs,
  markResultsSeenAtom,
  resultsSeenAtom,
  syncAnnouncementsAtom,
  unseeAnnouncementsAtom,
} from "@/lib/seen-state";

const bgTaskName = "cdsf-announcements-background-sync";
const bgIntervalMins = 15;
const notifColor = "#2457b3";
const previewMaxLen = 140;
const isWeb = Platform.OS === "web";

type NotificationTarget = "announcements" | "competition-results";

type NotificationPermissions = Awaited<
  ReturnType<typeof Notifications.getPermissionsAsync>
>;
type Channel = {
  id: string;
  name: string;
  description: string;
};

type NotificationContent = Pick<
  Notifications.NotificationContentInput,
  "body" | "color" | "subtitle" | "title"
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

const announcementsChannel: Channel = {
  id: "cdsf-announcements",
  name: "Aktuality",
  description: "Upozornění na nová sdělení v části Aktuality.",
};

const resultsChannel: Channel = {
  id: "cdsf-results",
  name: "Výsledky",
  description: "Upozornění na nově zveřejněné výsledky soutěží.",
};
const targetRoutes = {
  announcements: "/announcements",
  "competition-results": "/competitions?tab=results",
} as const satisfies Record<NotificationTarget, string>;
const gradeLabels: Partial<
  Record<NonNullable<PublishedCompetitionResult["competition"]["grade"]>, string>
> = {
  Championship: "MČR",
  League: "TL",
  SuperLeague: "STL",
};
const disciplineLabels: Partial<
  Record<
    NonNullable<PublishedCompetitionResult["competition"]["discipline"]>,
    string
  >
> = {
  Standard: "STT",
  Latin: "LAT",
  TenDances: "10T",
  "Standard+Latin": "STT + LAT",
  SingleOfTenDances: "Single 10T",
  FreeStyle: "Freestyle",
};

const androidChannel = {
  enableLights: true,
  enableVibrate: true,
  importance: Notifications.AndroidImportance.HIGH,
  lightColor: notifColor,
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  showBadge: true,
  vibrationPattern: [0, 250, 150, 250],
};

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

async function ensureChannel(channel: Channel) {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(channel.id, {
    ...androidChannel,
    name: channel.name,
    description: channel.description,
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

function getAnnouncementsContent(unseen: readonly Notification[]) {
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

function formatCompetitionClass(result: PublishedCompetitionResult) {
  const classLabel = result.competition.class;

  return !classLabel ||
    classLabel === "Open" ||
    classLabel ===
      ("Unknown" as PublishedCompetitionResult["competition"]["class"])
    ? undefined
    : classLabel;
}

function formatCompetitionGrade(result: PublishedCompetitionResult) {
  const grade = result.competition.grade;

  return grade ? gradeLabels[grade] : undefined;
}

function formatCompetitionDiscipline(result: PublishedCompetitionResult) {
  const discipline = result.competition.discipline;

  return (
    (discipline ? disciplineLabels[discipline] : undefined) ?? discipline
  );
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

async function scheduleNotification(
  channel: Channel,
  target: NotificationTarget,
  content: NotificationContent,
) {
  await ensureChannel(channel);
  await Notifications.scheduleNotificationAsync({
    content: {
      ...content,
      data: {
        target,
      },
    },
    trigger:
      Platform.OS === "android"
        ? {
            channelId: channel.id,
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

  const [preferences, seenState] = await Promise.all([
    appStore.get(notificationPreferencesAtom),
    appStore.get(announcementsSeenAtom),
  ]);

  if (seenState.latestCreatedMs === null) {
    return false;
  }

  const result = await syncNotifications({
    authHeaders: { Authorization: session.token },
    maxPages: 3,
    preferences,
    seenState,
  });
  const latest = result.visible.find(
    (notification) =>
      getAnnouncementCreatedMs(notification) === seenState.latestCreatedMs &&
      seenState.latestIds.includes(notification.id.toString()),
  );

  if (!latest) {
    return false;
  }

  await appStore.set(unseeAnnouncementsAtom, [latest.id.toString()]);

  await runBgTask();
  return true;
}

async function runAnnouncementsSync(allowLocal: boolean) {
  const session = await appStore.get(sessionAtom);
  if (!session) {
    return;
  }

  const [seen, preferences] = await Promise.all([
    appStore.get(announcementsSeenAtom),
    appStore.get(notificationPreferencesAtom),
  ]);
  const result = await syncNotifications({
    authHeaders: { Authorization: session.token },
    preferences,
    seenState: seen,
  });

  if (!seen.initialized) {
    await appStore.set(syncAnnouncementsAtom, result.notifications);
    return;
  }

  if (result.unseen.length && !allowLocal) {
    return;
  }

  if (result.unseen.length) {
    await scheduleNotification(
      announcementsChannel,
      "announcements",
      getAnnouncementsContent(result.unseen),
    );
  }

  if (result.notifications.length) {
    await appStore.set(syncAnnouncementsAtom, result.notifications);
  }
}

async function runCompetitionResultsSync(allowLocal: boolean) {
  const session = await appStore.get(sessionAtom);
  if (!session) {
    return;
  }

  const seen = await appStore.get(resultsSeenAtom);
  const initialized = seen.initialized;
  const result = await syncCompetitionResults({
    authHeaders: { Authorization: session.token },
    maxPages: initialized ? 3 : Number.POSITIVE_INFINITY,
    seenIds: seen.ids,
    stopWhen: ({ nextPage, unseen }) =>
      nextPage === undefined || (initialized && unseen.length > 0),
  });
  const results = initialized ? result.unseen : result.results;

  if (!results.length) {
    if (!initialized) {
      await appStore.set(markResultsSeenAtom, []);
    }

    return;
  }

  if (initialized && !allowLocal) {
    return;
  }

  if (initialized) {
    await scheduleNotification(
      resultsChannel,
      "competition-results",
      getResultsContent(results),
    );
  }

  await appStore.set(markResultsSeenAtom, results.map(({ id }) => id));
}

async function runAllSyncs(allowLocal: boolean) {
  const errors: unknown[] = [];

  try {
    await runAnnouncementsSync(allowLocal);
  } catch (error) {
    console.error("Announcements sync failed.", error);
    errors.push(error);
  }

  try {
    await runCompetitionResultsSync(allowLocal);
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

  await Promise.all([
    ensureChannel(announcementsChannel),
    ensureChannel(resultsChannel),
  ]);

  if (requestPermissions) {
    await requestNotificationsPermission();
  }

  await setBgTaskRegistered(true);
  await runAllSyncs(false);
}

export function useNotificationRuntime(enabled: boolean) {
  const router = useRouter();
  const session = useAtomValue(currentSessionAtom);
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
      const { data } = response.notification.request.content;
      const target =
        data &&
        typeof data === "object" &&
        "target" in data &&
        data.target === "competition-results"
          ? "competition-results"
          : "announcements";

      router.push(targetRoutes[target]);
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
      void setBgTaskRegistered(false).catch((error) => {
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
