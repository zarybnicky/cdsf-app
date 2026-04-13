import * as SecureStore from "expo-secure-store";
import type { Middleware } from "openapi-fetch";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import { cdsfAppPurpose, fetchClient } from "@/lib/cdsf-client";
import { clearCache } from "@/lib/react-query";

export type Session = {
  email: string;
  token: string;
};
type AuthHeaders = {
  Authorization: string;
};

type SignInInput = {
  email: string;
  password: string;
};

type SessionContextValue = {
  isLoading: boolean;
  session: Session | null;
  authHeaders: AuthHeaders | undefined;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const storageKey = "session";
type StoredSession = string | null;
type StoredState = [isLoading: boolean, value: StoredSession];

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

function parseSession(value: string | null): Session | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<Session>;
    if (typeof parsed.email === "string" && typeof parsed.token === "string") {
      return { email: parsed.email, token: parsed.token };
    }
  } catch {
    // Ignore invalid persisted payloads and treat them as signed out.
  }

  return null;
}

async function saveSession(value: StoredSession) {
  if (Platform.OS === "web") {
    if (value === null) {
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, value);
    }

    return;
  }

  await (value === null
    ? SecureStore.deleteItemAsync(storageKey)
    : SecureStore.setItemAsync(storageKey, value));
}

async function loadSession() {
  if (Platform.OS === "web") {
    return localStorage.getItem(storageKey);
  }

  return SecureStore.getItemAsync(storageKey);
}

function useStoredSession(): [
  StoredState,
  (value: StoredSession) => Promise<void>,
] {
  const [state, setState] = useState<StoredState>([true, null]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const value = await loadSession();

        if (!cancelled) {
          setState([false, value]);
        }
      } catch {
        if (!cancelled) {
          setState([false, null]);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function setValue(value: StoredSession) {
    setState([false, value]);
    await saveSession(value);
  }

  return [state, setValue];
}

export async function getSession() {
  return parseSession(await loadSession());
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, storedSession], setStoredSession] = useStoredSession();
  const session = parseSession(storedSession);
  const authHeaders = session ? { Authorization: session.token } : undefined;
  const sessionRef = useRef(session);
  const setStoredSessionRef = useRef(setStoredSession);
  const isClearingInvalidSessionRef = useRef(false);

  sessionRef.current = session;
  setStoredSessionRef.current = setStoredSession;

  useEffect(() => {
    const unauthorizedMiddleware: Middleware = {
      async onResponse({ request, response, schemaPath }) {
        if (response.status !== 401 || isSessionRequest(schemaPath)) {
          return;
        }

        const authorization = request.headers.get("Authorization");
        const currentSession = sessionRef.current;

        if (
          isClearingInvalidSessionRef.current ||
          !authorization ||
          !currentSession ||
          currentSession.token !== authorization
        ) {
          return;
        }

        isClearingInvalidSessionRef.current = true;

        try {
          await clearCache();
          await setStoredSessionRef.current(null);
        } finally {
          isClearingInvalidSessionRef.current = false;
        }
      },
    };

    fetchClient.use(unauthorizedMiddleware);

    return () => {
      fetchClient.eject(unauthorizedMiddleware);
    };
  }, []);

  async function signIn({ email, password }: SignInInput) {
    if (session) {
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

    await setStoredSession(JSON.stringify({ email, token: `Bearer ${token}` }));
  }

  async function signOut() {
    const currentSession = session;

    await setStoredSession(null);

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
  }

  return (
    <SessionContext.Provider
      value={{ isLoading, session, authHeaders, signIn, signOut }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);

  if (value === null) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }

  return value;
}
