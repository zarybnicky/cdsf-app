import AsyncStorage from "@react-native-async-storage/async-storage";

import type { components } from "@/CDSF";

export type Notification = components["schemas"]["Notification"];
export type NotificationType = Notification["type"];
export type NotificationPreferences = Record<NotificationType, boolean>;

type PrefMeta = {
  label: string;
  description: string;
};

const preferencesStorageKey = "notification-preferences";

export const preferenceOrder = [
  "CompetitionMessage",
  "CompetitionChange",
  "CompetitionRegistrationEndChange",
  "MedicalCheckupExpiration",
  "ClubTransferCompletion",
  "ClubRepresentativeMessage",
  "DivisionRepresentativeMessage",
  "AdjudicatorsMessage",
  "OfficialsMessage",
  "ExecutiveBoardMinutes",
] as const satisfies readonly NotificationType[];

export const defaultPreferences: NotificationPreferences = {
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

export const preferenceMetadata: Record<
  NotificationType,
  PrefMeta
> = {
  CompetitionMessage: {
    label: "Zprávy k soutěžím",
    description: "Organizační informace a sdělení ke konkrétním soutěžím.",
  },
  CompetitionChange: {
    label: "Změny soutěží",
    description: "Změny termínu, místa, času nebo programu soutěže.",
  },
  CompetitionRegistrationEndChange: {
    label: "Termíny přihlášení",
    description: "Úpravy termínů uzávěrek přihlášek do soutěží.",
  },
  MedicalCheckupExpiration: {
    label: "Lékařská prohlídka",
    description: "Upozornění na blížící se konec platnosti lékařské prohlídky.",
  },
  ClubTransferCompletion: {
    label: "Dokončení přestupu",
    description: "Potvrzení, že byl klubový přestup dokončen.",
  },
  ClubRepresentativeMessage: {
    label: "Kluboví zástupci",
    description: "Sdělení určená klubovým zástupcům.",
  },
  DivisionRepresentativeMessage: {
    label: "Divizní zástupci",
    description: "Sdělení určená divizním zástupcům.",
  },
  AdjudicatorsMessage: {
    label: "Porotci",
    description: "Sdělení určená porotcům.",
  },
  OfficialsMessage: {
    label: "Funkcionáři",
    description: "Sdělení určená funkcionářům.",
  },
  ExecutiveBoardMinutes: {
    label: "Zápisy výkonné rady",
    description: "Zveřejněné zápisy, usnesení a další výstupy výkonné rady.",
  },
};

function normalizePrefs(
  value: Partial<NotificationPreferences> | null | undefined,
) {
  const candidate =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : undefined;
  const readBoolean = (...keys: string[]) => {
    for (const key of keys) {
      if (typeof candidate?.[key] === "boolean") {
        return candidate[key] as boolean;
      }
    }

    return undefined;
  };

  return {
    CompetitionMessage:
      readBoolean("CompetitionMessage") ??
      defaultPreferences.CompetitionMessage,
    CompetitionChange:
      readBoolean("CompetitionChange") ?? defaultPreferences.CompetitionChange,
    CompetitionRegistrationEndChange:
      readBoolean("CompetitionRegistrationEndChange") ??
      defaultPreferences.CompetitionRegistrationEndChange,
    MedicalCheckupExpiration:
      readBoolean("MedicalCheckupExpiration") ??
      defaultPreferences.MedicalCheckupExpiration,
    ClubTransferCompletion:
      readBoolean("ClubTransferCompletion") ??
      defaultPreferences.ClubTransferCompletion,
    ClubRepresentativeMessage:
      readBoolean("ClubRepresentativeMessage") ??
      defaultPreferences.ClubRepresentativeMessage,
    DivisionRepresentativeMessage:
      readBoolean("DivisionRepresentativeMessage") ??
      defaultPreferences.DivisionRepresentativeMessage,
    AdjudicatorsMessage:
      readBoolean("AdjudicatorsMessage") ??
      defaultPreferences.AdjudicatorsMessage,
    OfficialsMessage:
      readBoolean("OfficialsMessage") ?? defaultPreferences.OfficialsMessage,
    ExecutiveBoardMinutes:
      readBoolean("ExecutiveBoardMinutes") ??
      defaultPreferences.ExecutiveBoardMinutes,
  };
}

export function getPreferencesStorageKey(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail
    ? `${preferencesStorageKey}:${normalizedEmail}`
    : preferencesStorageKey;
}

async function readPrefs(key: string): Promise<NotificationPreferences | null> {
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return normalizePrefs(JSON.parse(storedValue) as Partial<NotificationPreferences>);
  } catch {
    return null;
  }
}

export async function loadPreferences(email?: string | null) {
  const scoped = await readPrefs(getPreferencesStorageKey(email));

  if (scoped) {
    return scoped;
  }

  const unscoped = await readPrefs(preferencesStorageKey);

  if (unscoped) {
    return unscoped;
  }

  return { ...defaultPreferences };
}

export async function savePreferences(
  preferences: NotificationPreferences,
  email?: string | null,
) {
  await AsyncStorage.setItem(
    getPreferencesStorageKey(email),
    JSON.stringify(normalizePrefs(preferences)),
  );
}

type NotificationFilterable = Pick<Notification, "overrideMuting" | "type">;

export function filterNotifications<T extends NotificationFilterable>(
  notifications: readonly T[],
  preferences: NotificationPreferences,
) {
  return notifications.filter((notification) =>
    notification.overrideMuting ? true : preferences[notification.type],
  );
}
