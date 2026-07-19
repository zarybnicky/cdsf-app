import { atom } from "jotai";
import { Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";
import { appStore } from "./app-store";

const storage = createMMKV({ id: "fed-state" });
const canUseStorage = Platform.OS !== "web" || typeof window !== "undefined";
const resetters: (() => void)[] = [];

export function atomWithMMKV<T>(key: string, initial: T) {
  let stored = initial;

  if (canUseStorage) {
    const raw = storage.getString(key);
    if (raw !== undefined) {
      try {
        stored = JSON.parse(raw) as T;
      } catch {
        // Invalid cache entries fall back to the domain's initial value.
      }
    }
  }

  const baseAtom = atom(stored);
  const persistedAtom = atom(
    (get) => get(baseAtom),
    (get, set, update: T | ((previous: T) => T)) => {
      const previous = get(baseAtom);
      const value =
        typeof update === "function"
          ? (update as (current: T) => T)(previous)
          : update;
      if (canUseStorage) {
        storage.set(key, JSON.stringify(value));
      }
      set(baseAtom, value);
    },
  );

  resetters.push(() => appStore.set(baseAtom, initial));
  return persistedAtom;
}

export function clearPersistedState(): void {
  resetters.forEach((reset) => reset());
  if (canUseStorage) {
    storage.clearAll();
  }
}
