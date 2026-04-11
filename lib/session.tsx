import { createContext, PropsWithChildren, useContext } from 'react';

import { useStorageState } from '@/lib/use-storage-state';

type SessionContextValue = {
  isLoading: boolean;
  session: string | null;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');

  async function signIn({ email }: { email: string; password: string }) {
    await setSession(email);
  }

  async function signOut() {
    await setSession(null);
  }

  return (
    <SessionContext.Provider value={{ isLoading, session, signIn, signOut }}>
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
