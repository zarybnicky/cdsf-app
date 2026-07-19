import { atom } from "jotai";
import type {
  Athlete,
  Competition,
  CompetitionResult,
  CompetitionStartListCompetitor,
  Event,
  EventRegistration,
  Notification,
  SyncState,
} from "./types";
import { emptySyncState } from "./types";
import { atomWithMMKV } from "./mmkv";
import {
  isNotificationVisible,
  notificationPreferencesAtom,
} from "./notification-preferences";

export const athleteAtom = atomWithMMKV<Athlete | null>("athlete", null);

export const registrationsAtom = atomWithMMKV<EventRegistration[]>(
  "registrations",
  [],
);

export const resultsSummaryAtom = atomWithMMKV<EventRegistration[]>(
  "results",
  [],
);

// Full CompetitionResult fetched on demand from /competitions/{id}/result.
export const resultsFullAtom = atomWithMMKV<Record<number, CompetitionResult>>(
  "results:full",
  {},
);

export const competitionsAtom = atomWithMMKV<Record<number, Competition>>(
  "competitions",
  {},
);

export const startlistsAtom = atomWithMMKV<
  Record<number, CompetitionStartListCompetitor[]>
>("startlists", {});

// Full event details loaded on demand; this is not the competition-discovery cache.
export const eventsAtom = atomWithMMKV<Record<number, Event>>("events", {});

export const notificationsAtom = atomWithMMKV<Record<number, Notification>>(
  "notifications",
  {},
);

export const syncStateAtom = atomWithMMKV<SyncState>(
  "syncState",
  emptySyncState,
);

export const seenNotificationsAtom = atomWithMMKV<Record<string, number>>(
  "seen:notifications",
  {},
);

// `notified` is keyed by a diff-key, not just an entity id, so that a second
// real change (e.g. check-in moved a second time) fires again.
export const notifiedAtom = atomWithMMKV<Record<string, number>>(
  "notified",
  {},
);

export const upcomingRegistrationsAtom = atom((get) => {
  const today = new Date().toISOString().slice(0, 10);
  return get(registrationsAtom)
    .filter((event) => event.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        a.eventName.localeCompare(b.eventName, "cs"),
    );
});

export const recentResultsAtom = atom((get) => {
  return [...get(resultsSummaryAtom)].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      a.eventName.localeCompare(b.eventName, "cs"),
  );
});

export const unseenNotificationCountAtom = atom((get) => {
  const notifs = get(notificationsAtom);
  const seen = get(seenNotificationsAtom);
  const preferences = get(notificationPreferencesAtom);

  return Object.values(notifs).filter(
    (notification) =>
      isNotificationVisible(notification, preferences) &&
      !(String(notification.id) in seen),
  ).length;
});
