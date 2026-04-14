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

type ResultsSeen = { ids: string[]; initialized: boolean };
type Update<T> = T | ((prev: T) => T);

const emptyAnnouncementsSeen: AnnouncementSeen = {
  initialized: false,
  latestCreatedMs: null,
  latestIds: [],
};
const emptyResultsSeen: ResultsSeen = { ids: [], initialized: false };

function storedAtom<T>(key: string, initialValue: T) {
  const baseAtom = atomWithStorage<T>(
    key,
    initialValue,
    createJSONStorage<T>(() => AsyncStorage),
    { getOnInit: true },
  );

  return [
    baseAtom,
    atom(
      async (get) => get(baseAtom),
      async (get, set, update: Update<T>) => {
        const prev = await get(baseAtom);
        const next =
          typeof update === "function"
            ? (update as (prev: T) => T)(prev)
            : update;

        if (next !== prev) {
          await set(baseAtom, next);
        }
      },
    ),
  ] as const;
}

function uniqueStrings(values: Iterable<string | number>) {
  return [...new Set(Array.from(values, String))];
}

const [announcementsBaseAtom, announcementsSeenAtom] = storedAtom("seen-state:announcements", emptyAnnouncementsSeen);
const [resultsBaseAtom, resultsSeenAtom] = storedAtom("seen-state:competition-results", emptyResultsSeen);

export { announcementsSeenAtom, resultsSeenAtom };

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

  return { latestCreatedMs, latestIds: [...latestIds] };
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

  if (createdMs !== state.latestCreatedMs) {
    return createdMs < state.latestCreatedMs;
  }

  return state.latestIds.includes(notification.id.toString());
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

      const latestIds = uniqueStrings([...prev.latestIds, ...latest.latestIds]);

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
    const idsToRemove = new Set(uniqueStrings(ids));

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
    const idsToAdd = uniqueStrings(ids);

    await set(resultsSeenAtom, (prev) => {
      const initialized = prev.initialized ? prev : { ...prev, initialized: true };

      if (idsToAdd.length === 0) {
        return initialized;
      }

      const nextIds = uniqueStrings([...prev.ids, ...idsToAdd]);

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
