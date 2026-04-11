import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import {
  defaultNotificationPreferences,
  getStoredNotificationPreferences,
  setStoredNotificationPreferences,
  type NotificationPreferences,
  type NotificationType,
} from '@/lib/notification-preferences';
import { useSession } from '@/lib/session';

type NotificationPreferencesContextValue = {
  isLoading: boolean;
  preferences: NotificationPreferences;
  setPreference: (type: NotificationType, enabled: boolean) => void;
};

const NotificationPreferencesContext =
  createContext<NotificationPreferencesContextValue | null>(null);

export function NotificationPreferencesProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState(defaultNotificationPreferences);
  const sessionEmail = session?.email ?? null;

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);

    void getStoredNotificationPreferences(sessionEmail)
      .then((storedPreferences) => {
        if (!isMounted) {
          return;
        }

        setPreferences(storedPreferences);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setPreferences(defaultNotificationPreferences);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
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
    <NotificationPreferencesContext.Provider value={{ isLoading, preferences, setPreference }}>
      {children}
    </NotificationPreferencesContext.Provider>
  );
}

export function useNotificationPreferences() {
  const value = useContext(NotificationPreferencesContext);

  if (value === null) {
    throw new Error(
      'useNotificationPreferences must be wrapped in a <NotificationPreferencesProvider />',
    );
  }

  return value;
}
