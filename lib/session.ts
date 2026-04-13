import * as SecureStore from "expo-secure-store";
import type { Middleware } from "openapi-fetch";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, loadable } from "jotai/utils";
import { Platform } from "react-native";

import { appStore } from "@/lib/app-store";
import { clearAuthenticatedAppState } from "@/lib/app-state";
import { cdsfAppPurpose, fetchClient } from "@/lib/cdsf-client";

export type Session = {
  email: string;
  token: string;
};

type SignInInput = {
  email: string;
  password: string;
};

const storageKey = "session";
const sessionStorage = createJSONStorage<Session | null>(() => ({
  getItem(key) {
    if (Platform.OS === "web") {
      return Promise.resolve(localStorage.getItem(key));
    }

    return SecureStore.getItemAsync(key);
  },
  setItem(key, value) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }

    return SecureStore.setItemAsync(key, value);
  },
  removeItem(key) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return Promise.resolve();
    }

    return SecureStore.deleteItemAsync(key);
  },
}));

function isSessionRequest(schemaPath: string) {
  return schemaPath === "/credentials" || schemaPath === "/credentials/current";
}

function signInError(status: number) {
  if (status === 401) {
    return "Zadaný e-mail nebo heslo nejsou správné.";
  }

  if (status === 400) {
    return "Přihlášení nelze dokončit.";
  }

  return "Přihlášení se nepodařilo dokončit.";
}

export const sessionAtom = atomWithStorage<Session | null>(
  storageKey,
  null,
  sessionStorage,
  {
    getOnInit: true,
  },
);
export const sessionLoadableAtom = loadable(sessionAtom);
export const sessionValueAtom = atom((get) => {
  const sessionState = get(sessionLoadableAtom);

  return sessionState.state === "hasData" ? sessionState.data : null;
});

export const signInAtom = atom(
  null,
  async (get, set, { email, password }: SignInInput) => {
    if (await get(sessionAtom)) {
      return;
    }

    const response = await fetchClient.POST("/credentials", {
      body: {
        login: email,
        password,
        purpose: cdsfAppPurpose,
      },
    });
    const token = response.data;

    if (!token) {
      throw new Error(signInError(response.response.status));
    }

    await set(sessionAtom, {
      email,
      token: `Bearer ${token}`,
    });
  },
);

export const signOutAtom = atom(null, async (get, set) => {
  const currentSession = await get(sessionAtom);

  try {
    await clearAuthenticatedAppState();
  } finally {
    await set(sessionAtom, null);
  }

  if (!currentSession) {
    return;
  }

  try {
    await fetchClient.DELETE("/credentials/current", {
      headers: {
        Authorization: currentSession.token,
      },
      params: {
        query: {
          purpose: cdsfAppPurpose,
        },
      },
    });
  } catch {
    // Local sign-out should still succeed if the network request fails.
  }
});

let sessionMiddlewareRegistered = false;
let isClearingInvalidSession = false;

export function ensureSessionMiddleware() {
  if (sessionMiddlewareRegistered) {
    return;
  }

  const unauthorizedMiddleware: Middleware = {
    async onResponse({ request, response, schemaPath }) {
      if (response.status !== 401 || isSessionRequest(schemaPath)) {
        return;
      }

      const authorization = request.headers.get("Authorization");
      const currentSession = await appStore.get(sessionAtom);

      if (
        isClearingInvalidSession ||
        !authorization ||
        !currentSession ||
        currentSession.token !== authorization
      ) {
        return;
      }

      isClearingInvalidSession = true;

      try {
        await clearAuthenticatedAppState();
      } finally {
        try {
          await appStore.set(sessionAtom, null);
        } finally {
          isClearingInvalidSession = false;
        }
      }
    },
  };

  fetchClient.use(unauthorizedMiddleware);
  sessionMiddlewareRegistered = true;
}
