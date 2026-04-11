import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  defaultNotificationPreferences,
  getStoredNotificationPreferences,
  setStoredNotificationPreferences,
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
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState(
    defaultNotificationPreferences,
  );
  const sessionEmail = session?.email ?? null;

  useEffect(() => {
    let isCancelled = false;

    async function loadNotificationPreferences() {
      setIsLoading(true);

      try {
        const storedPreferences =
          await getStoredNotificationPreferences(sessionEmail);

        if (!isCancelled) {
          setPreferences(storedPreferences);
        }
      } catch {
        if (!isCancelled) {
          setPreferences(defaultNotificationPreferences);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadNotificationPreferences();

    return () => {
      isCancelled = true;
    };
  }, [sessionEmail]);

  function setPreference(type: NotificationType, enabled: boolean) {
    setPreferences((currentPreferences) => {
      const nextPreferences = {
        ...currentPreferences,
        [type]: enabled,
      };

      void setStoredNotificationPreferences(nextPreferences, sessionEmail);
      return nextPreferences;
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
