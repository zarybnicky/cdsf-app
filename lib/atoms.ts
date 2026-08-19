import { atom } from "jotai";
import { formatCdsfDate } from "./cdsf";
import type {
  Athlete,
  Competition,
  CompetitionResult,
  CompetitionStartListCompetitor,
  Domain,
  Event,
  EventRegistration,
  Notification,
} from "./types";
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

export const eventsAtom = atomWithMMKV<Record<number, Event>>(
  "events:details",
  {},
);

export const notificationsAtom = atomWithMMKV<Record<number, Notification>>(
  "notifications",
  {},
);

type SyncState = Record<Domain, {
  lastSync: number | null;
  lastError: string | null;
}>;

export const syncStateAtom = atomWithMMKV<SyncState>("syncState", {
  athlete: {
    lastSync: null,
    lastError: null,
  },
  registrations: {
    lastSync: null,
    lastError: null,
  },
  registeredEvents: {
    lastSync: null,
    lastError: null,
  },
  results: {
    lastSync: null,
    lastError: null,
  },
  notifications: {
    lastSync: null,
    lastError: null,
  },
});

export const syncInProgressAtom = atom(false);

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
  const today = formatCdsfDate();
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

export const visibleNotificationsAtom = atom((get) => {
  const preferences = get(notificationPreferencesAtom);

  return Object.values(get(notificationsAtom))
    .filter((x) => isNotificationVisible(x, preferences))
    .sort((a, b) => b.created.localeCompare(a.created) || b.id - a.id);
});

export const unseenNotificationCountAtom = atom((get) => {
  const seen = get(seenNotificationsAtom);

  return get(visibleNotificationsAtom).filter((x) => !(String(x.id) in seen))
    .length;
});
