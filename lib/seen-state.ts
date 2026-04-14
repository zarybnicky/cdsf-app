import type { components } from "@/CDSF";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, RESET } from "jotai/utils";

import { appStore } from "@/lib/app-store";
import { getDateMs } from "@/lib/cdsf";

type AnnouncementRecord = Pick<
  components["schemas"]["Notification"],
  "created" | "id"
>;

export type AnnouncementSeen = {
  initialized: boolean;
  latestCreatedMs: number | null;
  latestIds: string[];
};

type ResultsSeen = {
  ids: string[];
  initialized: boolean;
};
type Update<T> = T | ((prev: T) => T);

const emptyAnnouncementsSeen: AnnouncementSeen = {
  initialized: false,
  latestCreatedMs: null,
  latestIds: [],
};
const emptyResultsSeen: ResultsSeen = {
  ids: [],
  initialized: false,
};

const announcementsBaseAtom = atomWithStorage<AnnouncementSeen>(
  "seen-state:announcements",
  emptyAnnouncementsSeen,
  createJSONStorage<AnnouncementSeen>(() => AsyncStorage),
  { getOnInit: true },
);

const resultsBaseAtom = atomWithStorage<ResultsSeen>(
  "seen-state:competition-results",
  emptyResultsSeen,
  createJSONStorage<ResultsSeen>(() => AsyncStorage),
  { getOnInit: true },
);

export const announcementsSeenAtom = atom(
  async (get) => get(announcementsBaseAtom),
  async (get, set, update: Update<AnnouncementSeen>) => {
    const prev = await get(announcementsBaseAtom);
    const next = typeof update === "function" ? update(prev) : update;
    if (next !== prev) {
      await set(announcementsBaseAtom, next);
    }
  },
);

export const resultsSeenAtom = atom(
  async (get) => get(resultsBaseAtom),
  async (get, set, update: Update<ResultsSeen>) => {
    const prev = await get(resultsBaseAtom);
    const next = typeof update === "function" ? update(prev) : update;
    if (next !== prev) {
      await set(resultsBaseAtom, next);
    }
  },
);

export function getAnnouncementCreatedMs({
  created,
}: Pick<AnnouncementRecord, "created">) {
  const createdMs = getDateMs(created);
  return Number.isFinite(createdMs) ? createdMs : Number.MIN_SAFE_INTEGER;
}

export function getLatestHead(notifications: Iterable<AnnouncementRecord>) {
  let latestCreatedMs: number | null = null;
  const latestIds = new Set<string>();

  for (const notification of notifications) {
    const createdMs = getAnnouncementCreatedMs(notification);
    const id = notification.id.toString();

    if (latestCreatedMs === null || createdMs > latestCreatedMs) {
      latestCreatedMs = createdMs;
      latestIds.clear();
      latestIds.add(id);
      continue;
    }

    if (createdMs === latestCreatedMs) {
      latestIds.add(id);
    }
  }

  return {
    latestCreatedMs,
    latestIds: [...latestIds],
  };
}

export function hasAnnouncementsBefore(
  notifications: Iterable<AnnouncementRecord>,
  createdMs: number | null,
) {
  if (createdMs === null) {
    return false;
  }

  for (const notification of notifications) {
    if (getAnnouncementCreatedMs(notification) < createdMs) {
      return true;
    }
  }

  return false;
}

export function isAnnouncementSeen(
  state: AnnouncementSeen,
  notification: AnnouncementRecord,
) {
  if (!state.initialized || state.latestCreatedMs === null) {
    return false;
  }
  const createdMs = getAnnouncementCreatedMs(notification);
  const id = notification.id.toString();

  return createdMs < state.latestCreatedMs
    ? true
    : createdMs > state.latestCreatedMs
      ? false
      : state.latestIds.includes(id);
}

export const syncAnnouncementsAtom = atom(
  null,
  async (_get, set, notifications: Iterable<AnnouncementRecord>) => {
    const latest = getLatestHead(notifications);

    await set(announcementsSeenAtom, (prev) => {
      const initialized = prev.initialized ? prev : { ...prev, initialized: true };

      if (latest.latestCreatedMs === null) {
        return initialized;
      }

      if (
        prev.latestCreatedMs === null ||
        latest.latestCreatedMs > prev.latestCreatedMs
      ) {
        return {
          initialized: true,
          latestCreatedMs: latest.latestCreatedMs,
          latestIds: latest.latestIds,
        };
      }

      if (latest.latestCreatedMs < prev.latestCreatedMs) {
        return initialized;
      }

      const latestIds = [...new Set([...prev.latestIds, ...latest.latestIds])];

      if (prev.initialized && latestIds.length === prev.latestIds.length) {
        return prev;
      }

      return {
        ...initialized,
        latestCreatedMs: prev.latestCreatedMs,
        latestIds,
      };
    });
  },
);

export const unseeAnnouncementsAtom = atom(
  null,
  async (_get, set, ids: Iterable<string | number>) => {
    const idsToRemove = new Set(Array.from(ids, String));

    await set(announcementsSeenAtom, (prev) => {
      if (
        idsToRemove.size === 0 ||
        prev.latestCreatedMs === null ||
        prev.latestIds.length === 0
      ) {
        return prev;
      }

      const latestIds = prev.latestIds.filter((id) => !idsToRemove.has(id));

      if (prev.initialized && latestIds.length === prev.latestIds.length) {
        return prev;
      }

      return {
        initialized: true,
        latestCreatedMs: prev.latestCreatedMs,
        latestIds,
      };
    });
  },
);

export const markResultsSeenAtom = atom(
  null,
  async (_get, set, ids: Iterable<string | number>) => {
    const idsToAdd = [...new Set(Array.from(ids, String))];

    await set(resultsSeenAtom, (prev) => {
      const initialized = prev.initialized ? prev : { ...prev, initialized: true };

      if (idsToAdd.length === 0) {
        return initialized;
      }

      const nextIds = [...new Set([...prev.ids, ...idsToAdd])];
      if (prev.initialized && nextIds.length === prev.ids.length) {
        return prev;
      }

      return {
        ...initialized,
        ids: nextIds,
      };
    });
  },
);

export async function clearSeenState() {
  await Promise.all([
    appStore.set(announcementsBaseAtom, RESET),
    appStore.set(resultsBaseAtom, RESET),
  ]);
}
