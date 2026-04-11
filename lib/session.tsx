import { createContext, PropsWithChildren, useContext, useMemo } from "react";

import { cdsfAppPurpose, fetchClient } from "@/lib/cdsf-client";
import { getStorageItemAsync, useStorageState } from "@/lib/use-storage-state";

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
export const sessionStorageKey = "session";

function createAuthHeaders(session: Session | null): AuthHeaders | undefined {
  return session ? { Authorization: session.token } : undefined;
}

function serializeSession(session: Session) {
  return JSON.stringify(session);
}

function getSignInErrorMessage(status: number) {
  if (status === 401) {
    return "Zadaný e-mail nebo heslo nejsou správné.";
  }

  if (status === 400) {
    return "Přihlášení nelze dokončit.";
  }

  return "Přihlášení se nepodařilo dokončit.";
}

export function parseStoredSession(
  storedSession: string | null,
): Session | null {
  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession) as Partial<Session>;

    if (typeof parsed.email === "string" && typeof parsed.token === "string") {
      return {
        email: parsed.email,
        token: parsed.token,
      };
    }
  } catch {
    // Ignore invalid persisted payloads and treat them as signed out.
  }

  return null;
}

export async function getStoredSession() {
  return parseStoredSession(await getStorageItemAsync(sessionStorageKey));
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, storedSession], setStoredSession] =
    useStorageState(sessionStorageKey);

  const session = useMemo<Session | null>(
    () => parseStoredSession(storedSession),
    [storedSession],
  );
  const authHeaders = useMemo(() => createAuthHeaders(session), [session]);

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
      throw new Error(getSignInErrorMessage(response.response.status));
    }

    await setStoredSession(
      serializeSession({
        email,
        token: `Bearer ${token}`,
      }),
    );
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
