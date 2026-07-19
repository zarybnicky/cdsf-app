import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { notifiedAtom } from "./atoms";
import { appStore } from "./app-store";
import type { SyncTrigger } from "../lib/types";

export interface NotificationDraft {
  key: string; // dedup key
  title: string;
  body?: string;
  data?: Record<string, unknown>;
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
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Aktuality a soutěže",
    description: "Aktuality, přihlášky a výsledky soutěží.",
    importance: Notifications.AndroidImportance.HIGH,
    showBadge: true,
  });
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

export async function dismissResultNotification(
  competitionId: number,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const presented = await Notifications.getPresentedNotificationsAsync();
  for (const notification of presented) {
    const data = notification.request.content.data as {
      type?: string;
      competitionId?: number;
    };
    if (data.type === "result" && data.competitionId === competitionId) {
      await Notifications.dismissNotificationAsync(
        notification.request.identifier,
      );
    }
  }
}

/**
 * Fire drafts as local notifications, deduplicating against `notified`.
 * Non-background syncs still record the dedup key so a later background
 * sync doesn't notify about a change the user already loaded in the app.
 */
export async function dispatchNotifications(
  drafts: NotificationDraft[],
  trigger: SyncTrigger,
): Promise<void> {
  if (drafts.length === 0) return;
  const notified = appStore.get(notifiedAtom);
  const next = { ...notified };
  const now = Date.now();
  const shouldDeliver = trigger === "background";
  if (shouldDeliver) {
    try {
      await ensureNotificationChannel();
    } catch {
      // Data sync succeeds even when the notification channel is unavailable.
    }
  }

  for (const d of drafts) {
    if (d.key in next) continue;
    next[d.key] = now;

    if (!shouldDeliver) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: d.title, body: d.body, data: d.data ?? {} },
        trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
      });
    } catch {
      // Best-effort; don't fail the sync if notification scheduling fails.
    }
  }

  appStore.set(notifiedAtom, next);
}
