import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type NotificationPreferences,
  type NotificationType,
} from "@/lib/notification-preferences";
import { useSession } from "@/lib/session";

type NotificationPreferencesContextValue = {
  isLoading: boolean;
  preferences: NotificationPreferences;
  setPreference: (type: NotificationType, enabled: boolean) => void;
};

const NotificationPreferencesContext =
  createContext<NotificationPreferencesContextValue | null>(null);

export function NotificationPreferencesProvider({
  children,
}: PropsWithChildren) {
  const { session } = useSession();
  const email = session?.email ?? null;
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      try {
        const stored = await loadPreferences(email);

        if (!cancelled) {
          setPreferences(stored);
        }
      } catch {
        if (!cancelled) {
          setPreferences(defaultPreferences);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [email]);

  function setPreference(type: NotificationType, enabled: boolean) {
    setPreferences((current) => {
      const next = {
        ...current,
        [type]: enabled,
      };

      void savePreferences(next, email);
      return next;
    });
  }

  return (
    <NotificationPreferencesContext.Provider
      value={{ isLoading, preferences, setPreference }}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const value = useContext(NotificationPreferencesContext);

  if (value === null) {
    throw new Error(
      "useNotificationPreferences must be wrapped in a <NotificationPreferencesProvider />",
    );
  }

  return value;
}
