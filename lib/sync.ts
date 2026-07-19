import { appStore } from "./app-store";
import { registrationsAtom, syncStateAtom } from "./atoms";
import { ApiError } from "./api";
import {
  syncAthlete,
  syncNotifications,
  syncRegistrations,
  syncResults,
} from "./domains";
import { dispatchNotifications, type NotificationDraft } from "./notify";
import type { Domain, SyncTrigger } from "./types";

const store = appStore;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const MIN_INTERVAL: Record<Domain, Record<SyncTrigger, number>> = {
  athlete: {
    initial: 0,
    foreground: 6 * HOUR,
    background: 24 * HOUR,
    manual: 0,
  },
  registrations: {
    initial: 0,
    foreground: 10 * MINUTE,
    background: 30 * MINUTE,
    manual: 0,
  },
  results: {
    initial: 0,
    foreground: 2 * MINUTE,
    background: 5 * MINUTE,
    manual: 0,
  },
  notifications: {
    initial: 0,
    foreground: 5 * MINUTE,
    background: 15 * MINUTE,
    manual: 0,
  },
};

type SyncOptions = {
  trigger: SyncTrigger;
  domains?: Domain[];
};

type DomainJob = () => Promise<NotificationDraft[] | void>;

type DomainSyncResult = {
  drafts: NotificationDraft[];
  succeeded: boolean;
};

const DOMAIN_JOBS = {
  athlete: syncAthlete,
  notifications: syncNotifications,
  registrations: syncRegistrations,
  results: syncResults,
} satisfies Record<Domain, DomainJob>;
const ALL_DOMAINS = Object.keys(DOMAIN_JOBS) as Domain[];

let syncQueue: Promise<void> = Promise.resolve();

export function sync(options: SyncOptions): Promise<void> {
  const queued = syncQueue.then(() => runSync(options));
  syncQueue = queued.catch(() => {});
  return queued;
}

async function runSync({ trigger, domains }: SyncOptions): Promise<void> {
  const state = store.get(syncStateAtom);
  const dueDomains = (domains ?? ALL_DOMAINS).filter((domain) =>
    isDue(domain, state[domain].lastSync, trigger),
  );
  const results = await Promise.all(
    dueDomains.map((domain) => runDomain(domain, DOMAIN_JOBS[domain])),
  );

  await dispatchNotifications(
    results.flatMap((result) => result.drafts),
    trigger,
  );

  if (results.some((result) => !result.succeeded)) {
    throw new Error("sync_failed");
  }
}

async function runDomain(
  domain: Domain,
  job: DomainJob,
): Promise<DomainSyncResult> {
  const isBaseline = store.get(syncStateAtom)[domain].lastSync === null;
  try {
    const drafts = await job();
    store.set(syncStateAtom, (state) => ({
      ...state,
      [domain]: { ...state[domain], lastSync: Date.now(), lastError: null },
    }));
    return {
      drafts: isBaseline ? [] : (drafts ?? []),
      succeeded: true,
    };
  } catch (error) {
    if (!isAbortError(error)) {
      markFailed(domain, error);
    }
    return { drafts: [], succeeded: false };
  }
}

function markFailed(domain: Domain, error: unknown): void {
  if (error instanceof ApiError && error.status === 401) return;
  const message = error instanceof Error ? error.message : String(error);
  store.set(syncStateAtom, (state) => ({
    ...state,
    [domain]: { ...state[domain], lastError: message },
  }));
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isDue(
  domain: Domain,
  lastSync: number | null,
  trigger: SyncTrigger,
): boolean {
  if (trigger === "initial" || trigger === "manual" || lastSync === null) {
    return true;
  }

  let interval = MIN_INTERVAL[domain][trigger];
  if (domain === "results" && !isCompetitionDay()) {
    interval = trigger === "background" ? 2 * HOUR : 30 * MINUTE;
  }
  return Date.now() - lastSync >= interval;
}

function isCompetitionDay(): boolean {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return store.get(registrationsAtom).some((event) => event.date === today);
}
