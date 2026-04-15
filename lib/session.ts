import type { Middleware } from "openapi-fetch";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, unwrap } from "jotai/utils";

import { appStore } from "@/lib/app-store";
import { clearAuthenticatedAppState } from "@/lib/app-state";
import { appPurpose, fetchClient } from "@/lib/cdsf-client";
import { secureStringStorage } from "@/lib/string-storage";

export type Session = {
  email: string;
  token: string;
};

type SignInInput = {
  email: string;
  password: string;
};

const storage = createJSONStorage<Session | null>(() => secureStringStorage);

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

export const sessionAtom = atomWithStorage<Session | null>(
  "session",
  null,
  storage,
  {
    getOnInit: true,
  },
);
export const sessionStateAtom = unwrap(sessionAtom, () => undefined);
export const currentSessionAtom = atom((get) => get(sessionStateAtom) ?? null);

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
        purpose: appPurpose,
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
          purpose: appPurpose,
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
      if (response.status !== 401 || isAuthPath(schemaPath)) {
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
