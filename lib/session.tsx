import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { cdsfAppPurpose, fetchClient } from '@/lib/cdsf-client';
import { getStorageItemAsync, useStorageState } from '@/lib/use-storage-state';

export type Session = {
  email: string;
  token: string;
};

type SignInInput = {
  email: string;
  password: string;
};

type SessionContextValue = {
  isLoading: boolean;
  session: Session | null;
  authHeaders: { Authorization: string } | undefined;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);
export const sessionStorageKey = 'session';

export function parseStoredSession(storedSession: string | null): Session | null {
  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession) as Partial<Session>;

    if (typeof parsed.email === 'string' && typeof parsed.token === 'string') {
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
  const [[isLoading, storedSession], setStoredSession] = useStorageState(sessionStorageKey);

  const session = useMemo<Session | null>(() => parseStoredSession(storedSession), [storedSession]);

  const authHeaders = useMemo(
    () => (session ? { Authorization: session.token } : undefined),
    [session],
  );

  async function signIn({ email, password }: SignInInput) {
    if (session) {
      return;
    }

    const response = await fetchClient.POST('/credentials', {
      body: {
        login: email,
        password,
        purpose: cdsfAppPurpose,
      },
    });

    if (!response.data) {
      const status = response.response.status;

      if (status === 401) {
        throw new Error('Invalid email or password.');
      }

      if (status === 400) {
        throw new Error('The login request was rejected.');
      }

      throw new Error('Unable to sign in right now.');
    }

    await setStoredSession(
      JSON.stringify({
        email,
        token: `Bearer ${response.data}`,
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
      await fetchClient.DELETE('/credentials/current', {
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
    <SessionContext.Provider value={{ isLoading, session, authHeaders, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);

  if (value === null) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}
