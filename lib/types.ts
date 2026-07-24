import type { components } from "../CDSF";

type schemas = components["schemas"];

export type Athlete = schemas["Athlete"];
export type EventRegistration = schemas["EventRegistration"];
export type CompetitionRegistration = schemas["CompetitionRegistration"];
export type Competition = schemas["Competition"] & {
  completedAt?: string;
};
export type CompetitionResult = schemas["CompetitionResult"];
export type CompetitionStartListCompetitor =
  schemas["CompetitionStartListCompetitor"];
export type Notification = schemas["Notification"];

export interface EventDetails {
  id: number;
  dayOfEvent?: number;
  name: string;
  date?: string;
  city?: string;
  street?: string;
  zipCode?: string;
  gps?: string;
  addressNote?: string;
  organizer?: string;
  coOrganizer?: string;
  supporter?: string;
  promoter?: string;
  promoterWeb?: string;
  promoterPropagation?: string;
  responsiblePerson?: string;
  phone?: string;
  email?: string;
  music?: string;
  danceFloor?: string;
  entranceFee?: string;
  prizes?: string;
  costs?: string;
  note?: string;
  bankAccount?: string;
  registrationDeadline?: string;
  excuseDeadline?: string;
  hallOpening?: string;
  competitionsStart?: string;
  juryMeeting?: string;
}

export type Event = Omit<schemas["Event"], "competitions" | "officials"> & {
  competitions: Competition[];
  details: EventDetails;
  officials: Array<
    Omit<schemas["Official"], "licences"> & {
      licences?: Array<schemas["OfficialLicence"] & { role?: number }>;
    }
  >;
};

export type SyncTrigger = "initial" | "foreground" | "background" | "manual";
export type Domain =
  | "athlete"
  | "registrations"
  | "registeredEvents"
  | "results"
  | "notifications";

export interface DomainSyncState {
  lastSync: number | null; // epoch ms of last successful sync
  lastError: string | null;
}

export interface SyncState {
  athlete: DomainSyncState;
  registrations: DomainSyncState;
  registeredEvents: DomainSyncState;
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
  registeredEvents: {
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
