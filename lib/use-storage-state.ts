import * as SecureStore from "expo-secure-store";
import { useEffect, useReducer } from "react";
import { Platform } from "react-native";

type StorageValue = string | null;
type StorageState = [isLoading: boolean, value: StorageValue];
type UseStorageStateHook = [
  StorageState,
  (value: StorageValue) => Promise<void>,
];

function useAsyncState(
  initialState: StorageState = [true, null],
): [StorageState, (value: StorageValue) => void] {
  return useReducer(
    (_state: StorageState, value: StorageValue): StorageState => [false, value],
    initialState,
  );
}

export async function setStorageItemAsync(key: string, value: StorageValue) {
  if (Platform.OS === "web") {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }

    return;
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getStorageItemAsync(key: string) {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export function useStorageState(key: string): UseStorageStateHook {
  const [state, setState] = useAsyncState();

  useEffect(() => {
    let isCancelled = false;

    async function loadStoredValue() {
      try {
        const value = await getStorageItemAsync(key);

        if (!isCancelled) {
          setState(value);
        }
      } catch {
        if (!isCancelled) {
          setState(null);
        }
      }
    }

    void loadStoredValue();

    return () => {
      isCancelled = true;
    };
  }, [key]);

  async function setValue(value: StorageValue) {
    setState(value);
    await setStorageItemAsync(key, value);
  }

  return [state, setValue];
}
