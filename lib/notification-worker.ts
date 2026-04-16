import { Platform } from "react-native";

import * as Notifications from "expo-notifications";

import { appStore } from "@/lib/app-store";
import {
  type PublishedCompetitionResult,
  syncCompetitionResults,
} from "@/lib/competition-results-sync";
import {
  formatCompetitionLabel,
  formatCompetitionPlacement,
} from "@/lib/competition-format";
import { stripMarkdown } from "@/lib/markdown";
import { notificationPreferencesAtom } from "@/lib/notification-preferences";
import {
  getNotificationPreview,
  type Notification,
  syncNotifications,
} from "@/lib/notification-sync";
import { sessionAtom } from "@/lib/session";
import {
  announcementsSeenAtom,
  getAnnouncementCreatedMs,
  markResultsSeenAtom,
  resultsSeenAtom,
  syncAnnouncementsAtom,
  unseeAnnouncementsAtom,
} from "@/lib/seen-state";

const notifColor = "#2457b3";
type Channel = {
  description: string;
  id: string;
  name: string;
};

type NotificationContent = Pick<
  Notifications.NotificationContentInput,
  "body" | "color" | "subtitle" | "title"
>;

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

const androidChannel = {
  enableLights: true,
  enableVibrate: true,
  importance: Notifications.AndroidImportance.HIGH,
  lightColor: notifColor,
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  showBadge: true,
  vibrationPattern: [0, 250, 150, 250],
};

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

function getAnnouncementsContent(unseen: readonly Notification[]) {
  const [latest] = unseen;
  const latestTitle = stripMarkdown(latest.caption);
  const count = unseen.length;
  const single = count === 1;
  const preview = getNotificationPreview(latest);

  return {
    body: single ? preview : `${preview} · +${count - 1} další`,
    color: notifColor,
    subtitle: single ? "Aktuality ČSTS" : latestTitle,
    title: single ? latestTitle : `Nové aktuality ČSTS (${count})`,
  };
}

function getResultsContent(unseen: readonly PublishedCompetitionResult[]) {
  const [latest] = unseen;
  const count = unseen.length;
  const single = count === 1;
  const placement = formatCompetitionPlacement(
    latest.competition.ranking,
    latest.competition.rankingTo,
  );
  const resultSummary = `${formatCompetitionLabel(latest.competition)} · ${
    placement ? `${placement} místo` : "Výsledek byl zveřejněn."
  }`;

  return {
    body: single ? resultSummary : `${resultSummary} · +${count - 1} další`,
    color: notifColor,
    subtitle: single ? "Výsledky soutěží" : latest.event.eventName,
    title: single ? latest.event.eventName : `Nové výsledky soutěží (${count})`,
  };
}

async function scheduleNotification(
  channel: Channel,
  target: "announcements" | "competition-results",
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

async function runAnnouncementsSync(token: string, allowLocal: boolean) {
  const [seen, preferences] = await Promise.all([
    appStore.get(announcementsSeenAtom),
    appStore.get(notificationPreferencesAtom),
  ]);
  const result = await syncNotifications({
    preferences,
    seenState: seen,
    token,
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

async function runCompetitionResultsSync(token: string, allowLocal: boolean) {
  const seen = await appStore.get(resultsSeenAtom);
  const initialized = seen.initialized;
  const result = await syncCompetitionResults({
    maxPages: initialized ? 3 : Number.POSITIVE_INFINITY,
    seenIds: seen.ids,
    stopWhen: ({ nextPage, unseen }) =>
      nextPage === undefined || (initialized && unseen.length > 0),
    token,
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

  await appStore.set(
    markResultsSeenAtom,
    results.map(({ id }) => id),
  );
}

export async function ensureNotificationChannels() {
  await Promise.all([
    ensureChannel(announcementsChannel),
    ensureChannel(resultsChannel),
  ]);
}

export async function replayLatestNotificationForTest(allowLocal: boolean) {
  const token = (await appStore.get(sessionAtom))?.token;

  if (!token) {
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
    preferences,
    seenState,
    token,
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
  await runNotificationSyncs(allowLocal);
  return true;
}

export async function runNotificationSyncs(allowLocal: boolean) {
  const token = (await appStore.get(sessionAtom))?.token;

  if (!token) {
    return;
  }

  const errors: unknown[] = [];

  try {
    await runAnnouncementsSync(token, allowLocal);
  } catch (error) {
    console.error("Announcements sync failed.", error);
    errors.push(error);
  }

  try {
    await runCompetitionResultsSync(token, allowLocal);
  } catch (error) {
    console.error("Competition results sync failed.", error);
    errors.push(error);
  }

  if (errors.length > 0) {
    throw errors[0];
  }
}
