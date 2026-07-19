import type { components } from "../CDSF";

type schemas = components["schemas"];

export type Athlete = schemas["Athlete"];
export type EventRegistration = schemas["EventRegistration"];
export type CompetitionRegistration = schemas["CompetitionRegistration"];
export type Competition = schemas["Competition"];
export type CompetitionResult = schemas["CompetitionResult"];
export type CompetitionStartListCompetitor =
  schemas["CompetitionStartListCompetitor"];
export type Notification = schemas["Notification"];
export type Event = schemas["Event"];

export type SyncTrigger = "initial" | "foreground" | "background" | "manual";
export type Domain = "athlete" | "registrations" | "results" | "notifications";

export interface DomainSyncState {
  lastSync: number | null; // epoch ms of last successful sync
  lastError: string | null;
}

export interface SyncState {
  athlete: DomainSyncState;
  registrations: DomainSyncState;
  results: DomainSyncState;
  notifications: DomainSyncState;
}

export const emptySyncState: SyncState = {
  athlete: {
    lastSync: null,
    lastError: null,
  },
  registrations: {
    lastSync: null,
    lastError: null,
  },
  results: {
    lastSync: null,
    lastError: null,
  },
  notifications: {
    lastSync: null,
    lastError: null,
  },
};
