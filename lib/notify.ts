import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { notifiedAtom } from "./atoms";
import { appStore } from "./app-store";
import type { SyncTrigger } from "./types";

export type NotificationNavigationData =
  | { type: "notification"; id: number }
  | {
      type: "registration" | "result";
      competitionId: number;
      eventId?: number;
    };

export interface NotificationDraft {
  key: string; // dedup key
  title: string;
  body?: string;
  data: NotificationNavigationData;
}

const CHANNEL_ID = "fed-updates";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Aktuality a soutěže",
      description: "Aktuality, přihlášky a výsledky soutěží.",
      importance: Notifications.AndroidImportance.HIGH,
      showBadge: true,
    });
  }
}

export async function prepareNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await ensureNotificationChannel();
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && permissions.canAskAgain) {
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
  }
}

export async function dismissResultNotification(competitionId: number) {
  if (Platform.OS === "web") return;
  const presented = await Notifications.getPresentedNotificationsAsync();
  for (const { request } of presented) {
    const data = request.content.data as NotificationNavigationData;
    if (data.type === "result" && data.competitionId === competitionId) {
      await Notifications.dismissNotificationAsync(request.identifier);
    }
  }
}

export async function dispatchNotifications(drafts: NotificationDraft[], trigger: SyncTrigger) {
  if (drafts.length === 0) return;
  const next = { ...appStore.get(notifiedAtom) };

  if (trigger !== "background") {
    for (const { key } of drafts) next[key] ??= Date.now();
    appStore.set(notifiedAtom, next);
    return;
  }

  await ensureNotificationChannel().catch(() => {});

  for (const d of drafts) {
    if (d.key in next) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: d.title, body: d.body, data: d.data },
        trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
      });
      next[d.key] = Date.now();
    } catch {
    }
  }

  appStore.set(notifiedAtom, next);
}
