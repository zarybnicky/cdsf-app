import type { Middleware } from "openapi-fetch";
import * as SecureStore from "expo-secure-store";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, unwrap } from "jotai/utils";
import type { AsyncStringStorage } from "jotai/vanilla/utils/atomWithStorage";
import { Platform } from "react-native";

import { store } from "@/lib/app-store";
import { apiClient } from "@/lib/api";
import { clearPersistedState } from "@/lib/mmkv";

const APP_PURPOSE = "Mobilní aplikace ČSTS 2.0";

type Session = {
  email: string;
  token: string;
};

type SignInInput = {
  email: string;
  password: string;
};

const webSessionStorage: AsyncStringStorage = {
  async getItem(key) {
    return typeof window === "undefined"
      ? null
      : window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  },
};
const nativeSessionStorage: AsyncStringStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};
const sessionStorage = createJSONStorage<Session | null>(() =>
  Platform.OS === "web" ? webSessionStorage : nativeSessionStorage,
);

function isAuthPath(schemaPath: string) {
  return schemaPath === "/credentials" || schemaPath === "/credentials/current";
}

function getSignInError(status: number) {
  if (status === 401) {
    return "Zadaný e-mail nebo heslo nejsou správné.";
  }

  if (status === 400) {
    return "Přihlášení nelze dokončit.";
  }

  return "Přihlášení se nepodařilo dokončit.";
}

const sessionAtom = atomWithStorage<Session | null>(
  "session",
  null,
  sessionStorage,
  {
    getOnInit: true,
  },
);
export const sessionStateAtom = unwrap(sessionAtom, () => undefined);

export const signInAtom = atom(
  null,
  async (get, set, { email, password }: SignInInput) => {
    if (await get(sessionAtom)) {
      return;
    }

    const response = await apiClient.POST("/credentials", {
      body: {
        login: email,
        password,
        purpose: APP_PURPOSE,
      },
    });
    const token = response.data;

    if (!token) {
      throw new Error(getSignInError(response.response.status));
    }

    await set(sessionAtom, {
      email,
      token: `Bearer ${token}`,
    });
  },
);

export const signOutAtom = atom(null, async (get, set) => {
  const currentSession = await get(sessionAtom);
  abortSessionRequests();

  try {
    clearPersistedState();
  } finally {
    await set(sessionAtom, null);
  }

  if (!currentSession) {
    return;
  }

  try {
    await apiClient.DELETE("/credentials/current", {
      headers: {
        Authorization: currentSession.token,
      },
      params: {
        query: {
          purpose: APP_PURPOSE,
        },
      },
    });
  } catch {
    // Local sign-out should still succeed if the network request fails.
  }
});

let isClearingInvalidSession = false;
let sessionAbortController = new AbortController();

function abortSessionRequests() {
  sessionAbortController.abort();
  sessionAbortController = new AbortController();
}

const sessionMiddleware: Middleware = {
  async onRequest({ request }) {
    if (!request.headers.has("Authorization")) {
      const currentSession = await store.get(sessionAtom);
      if (currentSession) {
        request.headers.set("Authorization", currentSession.token);
      }
    }

    return new Request(request, { signal: sessionAbortController.signal });
  },
  async onResponse({ request, response, schemaPath }) {
    if (response.status !== 401 || isAuthPath(schemaPath)) {
      return;
    }

    const authorization = request.headers.get("Authorization");
    const currentSession = await store.get(sessionAtom);

    if (
      isClearingInvalidSession ||
      !authorization ||
      !currentSession ||
      currentSession.token !== authorization
    ) {
      return;
    }

    isClearingInvalidSession = true;
    abortSessionRequests();

    try {
      clearPersistedState();
    } finally {
      try {
        await store.set(sessionAtom, null);
      } finally {
        isClearingInvalidSession = false;
      }
    }
  },
};

apiClient.use(sessionMiddleware);
