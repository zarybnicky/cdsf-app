import * as SecureStore from 'expo-secure-store';
import { useEffect, useReducer } from 'react';
import { Platform } from 'react-native';

type UseStorageStateHook = [
  [isLoading: boolean, value: string | null],
  (value: string | null) => Promise<void>,
];

function useAsyncState(
  initialState: [boolean, string | null] = [true, null],
): [[boolean, string | null], (value: string | null) => void] {
  return useReducer(
    (_state: [boolean, string | null], value: string | null) => [false, value] as [boolean, string | null],
    initialState,
  );
}

export async function setStorageItemAsync(key: string, value: string | null) {
  if (Platform.OS === 'web') {
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
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export function useStorageState(key: string): UseStorageStateHook {
  const [state, setState] = useAsyncState();

  useEffect(() => {
    getStorageItemAsync(key)
      .then((value) => {
        setState(value);
      })
      .catch(() => {
        setState(null);
      });
  }, [key]);

  async function setValue(value: string | null) {
    setState(value);
    await setStorageItemAsync(key, value);
  }

  return [state, setValue];
}
