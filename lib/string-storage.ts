import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AsyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { Platform } from "react-native";

const webStringStorage: AsyncStringStorage = {
  async getItem(key: string) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key: string) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  },
};

const nativeSecureStringStorage: AsyncStringStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export const asyncStringStorage: AsyncStringStorage =
  Platform.OS === "web" ? webStringStorage : AsyncStorage;

export const secureStringStorage: AsyncStringStorage =
  Platform.OS === "web" ? webStringStorage : nativeSecureStringStorage;
