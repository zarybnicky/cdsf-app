import { apiClient, fetchData } from "./api";
import { appStore } from "./app-store";
import {
  athleteAtom,
  registrationsAtom,
  resultsSummaryAtom,
  notificationsAtom,
  seenNotificationsAtom,
  syncStateAtom,
} from "./atoms";
import type { CompetitionRegistration, EventRegistration } from "./types";
import type { NotificationDraft } from "./notify";
import {
  isNotificationVisible,
  notificationPreferencesAtom,
} from "./notification-preferences";
import { formatSimpleDateTime } from "./cdsf";

const store = appStore;
const PAGE_SIZE = 100;

type Page<T> = {
  collection: T[];
  paging?: { totalCount?: number };
};

async function fetchAllPages<T>(
  fetchPage: (page: number, pageSize: number) => Promise<Page<T>>,
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;

  while (true) {
    const response = await fetchPage(page, PAGE_SIZE);
    items.push(...response.collection);

    const totalCount = response.paging?.totalCount;
    const reachedEnd =
      totalCount !== undefined
        ? items.length >= totalCount
        : response.collection.length < PAGE_SIZE;

    if (response.collection.length === 0 || reachedEnd) {
      return items;
    }

    page += 1;
  }
}

function fingerprint(fields: unknown[]): string {
  const value = JSON.stringify(fields);
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) | 0;
  }

  return (hash >>> 0).toString(36);
}

function registrationFingerprint(
  registration: CompetitionRegistration,
): string {
  return fingerprint([
    registration.competitionId,
    registration.checkInEnd ?? null,
    registration.class ?? null,
    registration.toClass ?? null,
    registration.discipline ?? null,
    registration.age ?? null,
    registration.registrationEnd ?? null,
  ]);
}

function resultFingerprint(result: CompetitionRegistration): string {
  return fingerprint([
    result.competitionId,
    result.completedAt ?? null,
    result.ranking ?? null,
    result.rankingTo ?? null,
    result.points ?? null,
    result.final ?? null,
  ]);
}

function competitionsById(events: EventRegistration[]) {
  const competitions = new Map<number, CompetitionRegistration>();

  for (const event of events) {
    for (const competition of event.competitions) {
      competitions.set(competition.competitionId, competition);
    }
  }

  return competitions;
}

export async function syncAthlete(): Promise<void> {
  const response = await fetchData(apiClient.GET("/athletes/current", {}));
  store.set(athleteAtom, response.collection?.[0] ?? null);
}

/** Returns local-notification drafts produced by this sync pass. */
export async function syncNotifications(): Promise<NotificationDraft[]> {
  const existing = store.get(notificationsAtom);
  const isBaseline =
    store.get(syncStateAtom).notifications.lastSync === null;
  const knownIds = new Set(Object.keys(existing).map(Number));
  const preferences = store.get(notificationPreferencesAtom);
  const fetched = new Map<number, (typeof existing)[number]>();
  let page = 1;

  while (true) {
    const response = await fetchData(
      apiClient.GET("/notifications", {
        params: { query: { page, pageSize: PAGE_SIZE } },
      }),
    );
    const items = response.collection ?? [];

    for (const notification of items) {
      fetched.set(notification.id, notification);
    }

    const totalCount = response.paging?.totalCount;
    const reachedKnownNotification = items.some((notification) =>
      knownIds.has(notification.id),
    );
    const reachedEnd =
      totalCount !== undefined
        ? fetched.size >= totalCount
        : items.length < PAGE_SIZE;

    if (
      knownIds.size === 0 ||
      items.length === 0 ||
      reachedKnownNotification ||
      reachedEnd
    ) {
      break;
    }

    page += 1;
  }

  const next = { ...existing };
  const drafts: NotificationDraft[] = [];

  for (const notification of fetched.values()) {
    next[notification.id] = notification;
    if (
      !knownIds.has(notification.id) &&
      isNotificationVisible(notification, preferences)
    ) {
      drafts.push({
        key: `notif:${notification.id}`,
        title: notification.caption,
        body: notification.message?.slice(0, 200),
        data: { type: "notification", id: notification.id },
      });
    }
  }

  if (isBaseline) {
    const ids = Object.keys(next);
    const seenAt = Date.now();
    store.set(seenNotificationsAtom, (seen) => {
      if (ids.every((id) => id in seen)) return seen;
      const nextSeen = { ...seen };
      for (const id of ids) {
        if (!(id in nextSeen)) nextSeen[id] = seenAt;
      }
      return nextSeen;
    });
  }

  store.set(notificationsAtom, next);
  return drafts;
}

export async function syncRegistrations(): Promise<NotificationDraft[]> {
  const previous = store.get(registrationsAtom);
  const previousById = competitionsById(previous);
  const fresh = await fetchAllPages<EventRegistration>(
    async (page, pageSize) => {
      const response = await fetchData(
        apiClient.GET("/athletes/current/competitions/registrations", {
          params: { query: { page, pageSize } },
        }),
      );
      return { collection: response.collection ?? [], paging: response.paging };
    },
  );
  const drafts: NotificationDraft[] = [];

  for (const event of fresh) {
    for (const registration of event.competitions) {
      const previousRegistration = previousById.get(registration.competitionId);
      const nextFingerprint = registrationFingerprint(registration);

      if (!previousRegistration) {
        drafts.push({
          key: `reg-new:${registration.competitionId}`,
          title: "Nová přihláška",
          body: registration.checkInEnd
            ? `Prezence do ${formatSimpleDateTime(registration.checkInEnd)}`
            : undefined,
          data: {
            type: "registration",
            competitionId: registration.competitionId,
          },
        });
      } else if (
        registrationFingerprint(previousRegistration) !== nextFingerprint
      ) {
        drafts.push({
          key: `reg-change:${registration.competitionId}:${nextFingerprint}`,
          title: "Změna přihlášky",
          body: "Změnily se údaje vaší přihlášky.",
          data: {
            type: "registration",
            competitionId: registration.competitionId,
          },
        });
      }
    }
  }

  store.set(registrationsAtom, fresh);
  return drafts;
}

export async function syncResults(): Promise<NotificationDraft[]> {
  const previous = store.get(resultsSummaryAtom);
  const previousById = competitionsById(previous);
  const fresh = await fetchAllPages<EventRegistration>(
    async (page, pageSize) => {
      const response = await fetchData(
        apiClient.GET("/athletes/current/competitions/results", {
          params: { query: { page, pageSize } },
        }),
      );
      return { collection: response.collection ?? [], paging: response.paging };
    },
  );
  const drafts: NotificationDraft[] = [];

  for (const event of fresh) {
    for (const result of event.competitions) {
      const previousResult = previousById.get(result.competitionId);
      const nextFingerprint = resultFingerprint(result);

      if (
        !previousResult ||
        resultFingerprint(previousResult) !== nextFingerprint
      ) {
        const body =
          result.ranking !== undefined
            ? `Pořadí: ${result.ranking}${
                result.rankingTo && result.rankingTo !== result.ranking
                  ? `–${result.rankingTo}`
                  : ""
              }`
            : "Je k dispozici nový výsledek.";
        drafts.push({
          key: `result:${result.competitionId}:${nextFingerprint}`,
          title: result.final ? "Konečný výsledek" : "Aktualizace výsledku",
          body,
          data: { type: "result", competitionId: result.competitionId },
        });
      }
    }
  }

  store.set(resultsSummaryAtom, fresh);
  return drafts;
}
