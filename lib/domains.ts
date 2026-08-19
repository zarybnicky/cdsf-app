import { apiClient, fetchData } from "./api";
import { store } from "./app-store";
import {
  athleteAtom,
  registrationsAtom,
  resultsSummaryAtom,
  notificationsAtom,
  seenNotificationsAtom,
  syncStateAtom,
} from "./atoms";
import type {
  CompetitionRegistration,
  Domain,
  EventRegistration,
} from "./types";
import type { NotificationDraft } from "./notify";
import {
  isNotificationVisible,
  notificationPreferencesAtom,
} from "./notification-preferences";
import { formatSimpleDateTime } from "./cdsf";
import { refreshCompetitionEvent } from "./competition-details";

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

function registrationFingerprint(reg: CompetitionRegistration): string {
  return JSON.stringify([
    reg.competitionId,
    reg.checkInEnd ?? null,
    reg.class ?? null,
    reg.toClass ?? null,
    reg.discipline ?? null,
    reg.age ?? null,
    reg.registrationEnd ?? null,
  ]);
}

function resultFingerprint(result: CompetitionRegistration): string {
  return JSON.stringify([
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

async function refreshAthlete(): Promise<void> {
  const response = await fetchData(apiClient.GET("/athletes/current", {}));
  store.set(athleteAtom, response.collection?.[0] ?? null);
}

/** Returns local-notification drafts produced by this sync pass. */
async function refreshNotifications(): Promise<NotificationDraft[]> {
  const existing = store.get(notificationsAtom);
  const isBaseline = store.get(syncStateAtom).notifications.lastSync === null;
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
    const reachedKnownNotification = items.some((x) => knownIds.has(x.id));
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

  for (const item of fetched.values()) {
    next[item.id] = item;
    if (!knownIds.has(item.id) && isNotificationVisible(item, preferences)) {
      drafts.push({
        key: `notif:${item.id}`,
        title: item.caption,
        body: item.message?.slice(0, 200),
        data: { type: "notification", id: item.id },
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

async function refreshRegistrations(): Promise<NotificationDraft[]> {
  const previous = store.get(registrationsAtom);
  const previousById = competitionsById(previous);
  const fresh = await fetchAllPages<EventRegistration>(
    async (page, pageSize) => {
      const { collection = [], paging } = await fetchData(
        apiClient.GET("/athletes/current/competitions/registrations", {
          params: { query: { page, pageSize } },
        }),
      );
      return { collection, paging };
    },
  );
  const drafts: NotificationDraft[] = [];

  for (const event of fresh) {
    for (const registration of event.competitions) {
      const prev = previousById.get(registration.competitionId);
      const nextFingerprint = registrationFingerprint(registration);

      if (!prev) {
        drafts.push({
          key: `reg-new:${registration.competitionId}`,
          title: "Nová přihláška",
          body: registration.checkInEnd
            ? `Prezence do ${formatSimpleDateTime(registration.checkInEnd)}`
            : undefined,
          data: {
            type: "registration",
            competitionId: registration.competitionId,
            eventId: event.eventId,
          },
        });
      } else if (registrationFingerprint(prev) !== nextFingerprint) {
        drafts.push({
          key: `reg-change:${registration.competitionId}:${nextFingerprint}`,
          title: "Změna přihlášky",
          body: "Změnily se údaje vaší přihlášky.",
          data: {
            type: "registration",
            competitionId: registration.competitionId,
            eventId: event.eventId,
          },
        });
      }
    }
  }

  store.set(registrationsAtom, fresh);
  return drafts;
}

async function refreshRegisteredEvents(): Promise<void> {
  const eventIds = new Set(
    store
      .get(registrationsAtom)
      .flatMap(({ eventId }) => (eventId ? [eventId] : [])),
  );
  await Promise.all([...eventIds].map(refreshCompetitionEvent));
}

async function refreshResults(): Promise<NotificationDraft[]> {
  const previous = store.get(resultsSummaryAtom);
  const previousById = competitionsById(previous);
  const fresh = await fetchAllPages<EventRegistration>(
    async (page, pageSize) => {
      const { collection = [], paging } = await fetchData(
        apiClient.GET("/athletes/current/competitions/results", {
          params: { query: { page, pageSize } },
        }),
      );
      return { collection, paging };
    },
  );
  const drafts: NotificationDraft[] = [];

  for (const event of fresh) {
    for (const result of event.competitions) {
      const prev = previousById.get(result.competitionId);
      const nextFingerprint = resultFingerprint(result);

      if (!prev || resultFingerprint(prev) !== nextFingerprint) {
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
          data: {
            type: "result",
            competitionId: result.competitionId,
            eventId: event.eventId,
          },
        });
      }
    }
  }

  store.set(resultsSummaryAtom, fresh);
  return drafts;
}

type DomainFetcher = () => Promise<NotificationDraft[] | void>;

const FETCHERS: { [key in Domain]: DomainFetcher } = {
  athlete: refreshAthlete,
  notifications: refreshNotifications,
  registrations: refreshRegistrations,
  registeredEvents: refreshRegisteredEvents,
  results: refreshResults,
};

export function refreshDomain(domain: Domain) {
  return FETCHERS[domain]();
}
