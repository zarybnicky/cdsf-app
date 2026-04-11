import AsyncStorage from '@react-native-async-storage/async-storage';

import type { components } from '@/CDSF';

export type Notification = components['schemas']['Notification'];
export type NotificationType = Notification['type'];
export type NotificationPreferences = Record<NotificationType, boolean>;

type NotificationPreferenceMetadata = {
  label: string;
  description: string;
};

type LegacyNotificationPreferences = {
  adjudicatorsMessage?: boolean;
  clubRepresentativeMessage?: boolean;
  clubTransferCompletion?: boolean;
  competitionChange?: boolean;
  competitionMessage?: boolean;
  competitionRegistrationEndChange?: boolean;
  divisionRepresentativeMessage?: boolean;
  executiveBoardMinutes?: boolean;
  medicalCheckupExpiration?: boolean;
  officialsMessage?: boolean;
};

export const notificationPreferencesStorageKey = 'notification-preferences';
const legacyNotificationPreferencesStorageKey = 'notificationPrefs';

export const notificationPreferenceOrder = [
  'CompetitionMessage',
  'CompetitionChange',
  'CompetitionRegistrationEndChange',
  'MedicalCheckupExpiration',
  'ClubTransferCompletion',
  'ClubRepresentativeMessage',
  'DivisionRepresentativeMessage',
  'AdjudicatorsMessage',
  'OfficialsMessage',
  'ExecutiveBoardMinutes',
] as const satisfies readonly NotificationType[];

export const defaultNotificationPreferences: NotificationPreferences = {
  CompetitionMessage: true,
  CompetitionChange: true,
  CompetitionRegistrationEndChange: true,
  MedicalCheckupExpiration: true,
  ClubTransferCompletion: true,
  ClubRepresentativeMessage: true,
  DivisionRepresentativeMessage: true,
  AdjudicatorsMessage: true,
  OfficialsMessage: true,
  ExecutiveBoardMinutes: true,
};

export const notificationPreferenceMetadata: Record<
  NotificationType,
  NotificationPreferenceMetadata
> = {
  CompetitionMessage: {
    label: 'Zpravy k soutezim',
    description: 'Prakticke informace a organizacni zpravy ke konkretnim soutezim.',
  },
  CompetitionChange: {
    label: 'Zmeny soutezi',
    description: 'Zmeny terminu, mista nebo programu soutezi.',
  },
  CompetitionRegistrationEndChange: {
    label: 'Terminy prihlaseni',
    description: 'Zmeny uzavirek prihlasovani do soutezi.',
  },
  MedicalCheckupExpiration: {
    label: 'Lekarska prohlidka',
    description: 'Upozorneni na koncici nebo propadlou lekarskou prohlidku.',
  },
  ClubTransferCompletion: {
    label: 'Dokonceni prestupu',
    description: 'Informace o dokoncenem klubovem prestupu.',
  },
  ClubRepresentativeMessage: {
    label: 'Klubovi zastupci',
    description: 'Zpravy urcene klubovym zastupcum.',
  },
  DivisionRepresentativeMessage: {
    label: 'Divizni zastupci',
    description: 'Zpravy urcene diviznim zastupcum.',
  },
  AdjudicatorsMessage: {
    label: 'Porotci',
    description: 'Zpravy pro porotce a adjudicators.',
  },
  OfficialsMessage: {
    label: 'Funkcionari',
    description: 'Zpravy urcene funkcionarum a officials.',
  },
  ExecutiveBoardMinutes: {
    label: 'Zapisy vykonne rady',
    description: 'Publikovane zapisy a administrativni vystupy vykonne rady.',
  },
};

function normalizeNotificationPreferences(
  value: Partial<NotificationPreferences> | LegacyNotificationPreferences | null | undefined,
) {
  const candidate =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
  const readBoolean = (...keys: string[]) => {
    for (const key of keys) {
      if (typeof candidate?.[key] === 'boolean') {
        return candidate[key] as boolean;
      }
    }

    return undefined;
  };

  return {
    CompetitionMessage:
      readBoolean('CompetitionMessage', 'competitionMessage') ??
      defaultNotificationPreferences.CompetitionMessage,
    CompetitionChange:
      readBoolean('CompetitionChange', 'competitionChange') ??
      defaultNotificationPreferences.CompetitionChange,
    CompetitionRegistrationEndChange:
      readBoolean('CompetitionRegistrationEndChange', 'competitionRegistrationEndChange') ??
      defaultNotificationPreferences.CompetitionRegistrationEndChange,
    MedicalCheckupExpiration:
      readBoolean('MedicalCheckupExpiration', 'medicalCheckupExpiration') ??
      defaultNotificationPreferences.MedicalCheckupExpiration,
    ClubTransferCompletion:
      readBoolean('ClubTransferCompletion', 'clubTransferCompletion') ??
      defaultNotificationPreferences.ClubTransferCompletion,
    ClubRepresentativeMessage:
      readBoolean('ClubRepresentativeMessage', 'clubRepresentativeMessage') ??
      defaultNotificationPreferences.ClubRepresentativeMessage,
    DivisionRepresentativeMessage:
      readBoolean('DivisionRepresentativeMessage', 'divisionRepresentativeMessage') ??
      defaultNotificationPreferences.DivisionRepresentativeMessage,
    AdjudicatorsMessage:
      readBoolean('AdjudicatorsMessage', 'adjudicatorsMessage') ??
      defaultNotificationPreferences.AdjudicatorsMessage,
    OfficialsMessage:
      readBoolean('OfficialsMessage', 'officialsMessage') ??
      defaultNotificationPreferences.OfficialsMessage,
    ExecutiveBoardMinutes:
      readBoolean('ExecutiveBoardMinutes', 'executiveBoardMinutes') ??
      defaultNotificationPreferences.ExecutiveBoardMinutes,
  };
}

export function getNotificationPreferencesStorageKey(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail
    ? `${notificationPreferencesStorageKey}:${normalizedEmail}`
    : notificationPreferencesStorageKey;
}

async function readStoredNotificationPreferences(
  key: string,
): Promise<NotificationPreferences | null> {
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return normalizeNotificationPreferences(
      JSON.parse(storedValue) as Partial<NotificationPreferences> | LegacyNotificationPreferences,
    );
  } catch {
    return null;
  }
}

export async function getStoredNotificationPreferences(email?: string | null) {
  const scopedPreferences = await readStoredNotificationPreferences(
    getNotificationPreferencesStorageKey(email),
  );

  if (scopedPreferences) {
    return scopedPreferences;
  }

  const unscopedPreferences = await readStoredNotificationPreferences(
    notificationPreferencesStorageKey,
  );

  if (unscopedPreferences) {
    return unscopedPreferences;
  }

  const legacyPreferences = await readStoredNotificationPreferences(
    legacyNotificationPreferencesStorageKey,
  );

  if (legacyPreferences) {
    return legacyPreferences;
  }

  return { ...defaultNotificationPreferences };
}

export async function setStoredNotificationPreferences(
  preferences: NotificationPreferences,
  email?: string | null,
) {
  await AsyncStorage.setItem(
    getNotificationPreferencesStorageKey(email),
    JSON.stringify(normalizeNotificationPreferences(preferences)),
  );
}

type NotificationFilterable = Pick<Notification, 'overrideMuting' | 'type'>;

export function shouldIncludeNotification(
  notification: NotificationFilterable,
  preferences: NotificationPreferences,
) {
  if (notification.overrideMuting) {
    return true;
  }

  return preferences[notification.type] !== false;
}

export function filterNotifications<T extends NotificationFilterable>(
  notifications: readonly T[],
  preferences: NotificationPreferences,
) {
  return notifications.filter((notification) => shouldIncludeNotification(notification, preferences));
}
