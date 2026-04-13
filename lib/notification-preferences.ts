import AsyncStorage from "@react-native-async-storage/async-storage";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage, loadable } from "jotai/utils";

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

const notificationPreferencesStorage =
  createJSONStorage<NotificationPreferences>(() => AsyncStorage);
export const notificationPreferencesAtom = atomWithStorage(
  preferencesStorageKey,
  defaultPreferences,
  notificationPreferencesStorage,
  {
    getOnInit: true,
  },
);
export const notificationPreferencesLoadableAtom = loadable(
  notificationPreferencesAtom,
);

export const preferenceMetadata: Record<NotificationType, PrefMeta> = {
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

export const setNotificationPreferenceAtom = atom(
  null,
  async (get, set, update: { enabled: boolean; type: NotificationType }) => {
    const current = await get(notificationPreferencesAtom);

    await set(notificationPreferencesAtom, {
      ...current,
      [update.type]: update.enabled,
    });
  },
);
