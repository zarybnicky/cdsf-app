import { appStore } from "./app-store";
import {
  registrationsAtom,
  syncInProgressAtom,
  syncStateAtom,
} from "./atoms";
import { ApiError } from "./api";
import { formatCdsfDate } from "./cdsf";
import { refreshDomain } from "./domains";
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
  registeredEvents: {
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

type DomainSyncResult = {
  drafts: NotificationDraft[];
  errors: unknown[];
};

const ALL_DOMAINS = Object.keys(MIN_INTERVAL) as Domain[];

let syncQueue: Promise<void> = Promise.resolve();

export function sync(options: SyncOptions): Promise<void> {
  const queued = syncQueue.then(async () => {
    store.set(syncInProgressAtom, true);
    try {
      await runSync(options);
    } finally {
      store.set(syncInProgressAtom, false);
    }
  });
  syncQueue = queued.catch(() => {});
  return queued;
}

async function runSync({ trigger, domains = ALL_DOMAINS }: SyncOptions): Promise<void> {
  const state = store.get(syncStateAtom);
  const dueDomains = new Set(domains.filter((x) => isDue(x, state[x].lastSync, trigger)));
  if (dueDomains.has("registrations")) dueDomains.add("registeredEvents");

  const registrationRun = dueDomains.has("registrations")
    ? runDomain("registrations")
    : undefined;
  const results = await Promise.all(
    [...dueDomains].map(async (domain) => {
      if (domain === "registrations" && registrationRun) {
        return registrationRun;
      }
      if (domain === "registeredEvents" && registrationRun) {
        const registration = await registrationRun;
        return registration.errors.length === 0
          ? runDomain(domain)
          : { drafts: [], errors: [] };
      }
      return runDomain(domain);
    }),
  );

  await dispatchNotifications(results.flatMap((x) => x.drafts), trigger);

  const errors = results.flatMap((x) => x.errors);
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "Sync failed");
}

async function runDomain(domain: Domain): Promise<DomainSyncResult> {
  const isBaseline = store.get(syncStateAtom)[domain].lastSync === null;
  try {
    const drafts = await refreshDomain(domain);
    store.set(syncStateAtom, (state) => ({
      ...state,
      [domain]: { ...state[domain], lastSync: Date.now(), lastError: null },
    }));
    return {
      drafts: isBaseline ? [] : (drafts ?? []),
      errors: [],
    };
  } catch (error) {
    if (!isAbortError(error)) {
      markFailed(domain, error);
    }
    return { drafts: [], errors: [error] };
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
  const today = formatCdsfDate();
  return store.get(registrationsAtom).some((event) => event.date === today);
}
