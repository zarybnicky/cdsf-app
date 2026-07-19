import { atomWithMMKV } from "@/lib/mmkv";
import type { Notification } from "@/lib/types";

export type NotificationType = Notification["type"];
export type NotificationPreferences = Record<NotificationType, boolean>;

type PrefMeta = {
  label: string;
  description: string;
};

export const preferenceOrder = [
  "CompetitionMessage",
  "CompetitionChange",
  "CompetitionCancelled",
  "CompetitionRegistered",
  "CompetitionRegistrationEndChange",
  "MedicalCheckupExpiration",
  "Loan",
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
  CompetitionCancelled: true,
  CompetitionRegistered: true,
  CompetitionRegistrationEndChange: true,
  MedicalCheckupExpiration: true,
  Loan: true,
  ClubTransferCompletion: true,
  ClubRepresentativeMessage: true,
  DivisionRepresentativeMessage: true,
  AdjudicatorsMessage: true,
  OfficialsMessage: true,
  ExecutiveBoardMinutes: true,
};

export const notificationPreferencesAtom =
  atomWithMMKV<NotificationPreferences>(
    "notification-preferences",
    defaultPreferences,
  );

export function isNotificationVisible(
  notification: Notification,
  preferences: NotificationPreferences,
): boolean {
  return Boolean(
    notification.overrideMuting || preferences[notification.type],
  );
}

export const preferenceMetadata: Record<NotificationType, PrefMeta> = {
  CompetitionMessage: {
    label: "Zprávy k soutěžím",
    description: "Organizační informace a sdělení ke konkrétním soutěžím.",
  },
  CompetitionChange: {
    label: "Změny soutěží",
    description: "Změny termínu, místa, času nebo programu soutěže.",
  },
  CompetitionCancelled: {
    label: "Zrušení soutěže",
    description: "Informace o zrušené soutěži nebo zrušené registraci.",
  },
  CompetitionRegistered: {
    label: "Potvrzení přihlášky",
    description: "Potvrzení, že byla registrace do soutěže zaevidována.",
  },
  CompetitionRegistrationEndChange: {
    label: "Termíny přihlášení",
    description: "Úpravy termínů uzávěrek přihlášek do soutěží.",
  },
  MedicalCheckupExpiration: {
    label: "Lékařská prohlídka",
    description: "Upozornění na blížící se konec platnosti lékařské prohlídky.",
  },
  Loan: {
    label: "Hostování",
    description:
      "Oznámení související s hostováním nebo krátkodobým uvolněním.",
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
