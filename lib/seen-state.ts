import AsyncStorage from "@react-native-async-storage/async-storage";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, RESET } from "jotai/utils";

import { appStore } from "@/lib/app-store";

export type SeenState = {
  ids: Set<string>;
  initialized: boolean;
};
type StoredSeenState = {
  ids: string[];
  initialized: boolean;
};

const seenStorage = createJSONStorage<StoredSeenState>(() => AsyncStorage);

function createSeenStateAtom(storageKey: string) {
  const storageAtom = atomWithStorage(
    storageKey,
    {
      ids: [],
      initialized: false,
    },
    seenStorage,
    {
      getOnInit: true,
    },
  );

  const stateAtom = atom(
    async (get): Promise<SeenState> => {
      const value = await get(storageAtom);

      return {
        ids: new Set(value.ids),
        initialized: value.initialized,
      };
    },
    async (get, set, update: SeenState | ((prev: SeenState) => SeenState)) => {
      const value = await get(storageAtom);
      const prev = {
        ids: new Set(value.ids),
        initialized: value.initialized,
      };
      const next = typeof update === "function" ? update(prev) : update;
      await set(storageAtom, {
        ids: [...next.ids],
        initialized: next.initialized,
      });
    },
  );

  return {
    stateAtom,
    storageAtom,
  };
}

const {
  stateAtom: announcementsSeenStateAtom,
  storageAtom: announcementsSeenStorageAtom,
} = createSeenStateAtom(`seen-state:announcements`);
const {
  stateAtom: competitionResultsSeenStateAtom,
  storageAtom: competitionResultsSeenStorageAtom,
} = createSeenStateAtom(`seen-state:competition-results`);

export { announcementsSeenStateAtom, competitionResultsSeenStateAtom };

function normalizeIds(ids: Iterable<string | number>) {
  return new Set(Array.from(ids, String));
}

export function addSeenIds(ids: Iterable<string | number>) {
  const idsToAdd = normalizeIds(ids);

  return (prev: SeenState) => {
    if (idsToAdd.size === 0) {
      return prev;
    }

    const nextIds = new Set(prev.ids);
    idsToAdd.forEach((id) => {
      nextIds.add(id);
    });

    if (nextIds.size === prev.ids.size && prev.initialized) {
      return prev;
    }

    return {
      ids: nextIds,
      initialized: true,
    };
  };
}

export function dropSeenIds(ids: Iterable<string | number>) {
  const idsToRemove = normalizeIds(ids);

  return (prev: SeenState) => {
    if (idsToRemove.size === 0) {
      return prev;
    }

    const nextIds = new Set(prev.ids);
    idsToRemove.forEach((id) => {
      nextIds.delete(id);
    });

    if (nextIds.size === prev.ids.size && prev.initialized) {
      return prev;
    }

    return {
      ids: nextIds,
      initialized: true,
    };
  };
}

export function initializeSeenState() {
  return (prev: SeenState) => {
    if (prev.initialized) {
      return prev;
    }

    return {
      ids: prev.ids,
      initialized: true,
    };
  };
}

export async function clearSeenState() {
  await Promise.all([
    appStore.set(announcementsSeenStorageAtom, RESET),
    appStore.set(competitionResultsSeenStorageAtom, RESET),
  ]);
}
