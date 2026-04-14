import type { components, paths } from "@/CDSF";
import type { InfiniteData } from "@tanstack/react-query";
import { atomWithInfiniteQuery } from "jotai-tanstack-query";

import { appStore } from "@/lib/app-store";
import { fetchClient, getData, pageCount, paging } from "@/lib/cdsf-client";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import { currentSessionAtom } from "@/lib/session";
import { resultsSeenAtom } from "@/lib/seen-state";

type Page =
  paths["/athletes/current/competitions/results"]["get"]["responses"][200]["content"]["application/json"];

export type CompetitionResultEvent = components["schemas"]["EventRegistration"];
export type CompetitionResultCompetition =
  components["schemas"]["CompetitionRegistration"];
export type PublishedCompetitionResult = {
  id: string;
  competition: CompetitionResultCompetition;
  event: CompetitionResultEvent;
};

export type SyncProgress = {
  events: CompetitionResultEvent[];
  nextPage: number | undefined;
  results: PublishedCompetitionResult[];
  unseen: PublishedCompetitionResult[];
};

export type SyncInput = {
  authHeaders?: {
    Authorization: string;
  };
  maxPages?: number;
  seenIds?: Iterable<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
};

const pageSize = 100;
const defaultPages = 3;
const key = ["competition-results"] as const;

export function flattenResults(events: readonly CompetitionResultEvent[]) {
  const results: PublishedCompetitionResult[] = [];
  const ids = new Set<string>();

  for (const event of events) {
    if (typeof event.eventId !== "number") {
      continue;
    }

    for (const competition of event.competitions) {
      const id = `${event.eventId}:${competition.competitionId}`;

      if (ids.has(id)) {
        continue;
      }

      ids.add(id);
      results.push({ id, competition, event });
    }
  }

  return results;
}

async function fetchCompetitionResultsPage({
  authHeaders,
  pageParam,
  signal,
}: {
  authHeaders: {
    Authorization: string;
  };
  pageParam: number;
  signal?: AbortSignal;
}) {
  return getData(
    await fetchClient.GET("/athletes/current/competitions/results", {
      headers: authHeaders,
      params: {
        query: {
          page: pageParam,
          pageSize,
        },
      },
      signal,
    }),
    "Competition results response did not include data.",
  );
}

export const competitionResultsAtom = atomWithInfiniteQuery((get) => {
  const session = get(currentSessionAtom);

  return {
    enabled: !!session,
    getNextPageParam: paging.next,
    initialPageParam: 1,
    queryKey: key,
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal: AbortSignal;
    }): Promise<Page> => {
      if (!session) {
        throw new Error("Session is not available.");
      }

      return fetchCompetitionResultsPage({
        authHeaders: {
          Authorization: session.token,
        },
        pageParam,
        signal,
      });
    },
  };
});

function buildProgress(pages: Page[], seen: ReadonlySet<string>) {
  const events = pages.flatMap((page) => page.collection || []);
  const results = flattenResults(events);

  return {
    events,
    nextPage: paging.next(pages.at(-1)),
    results,
    unseen: results.filter((result) => !seen.has(result.id)),
  } satisfies SyncProgress;
}

export async function syncCompetitionResults({
  authHeaders,
  maxPages = defaultPages,
  seenIds,
  stopWhen,
}: SyncInput): Promise<SyncProgress> {
  if (!authHeaders) {
    return {
      events: [],
      nextPage: undefined,
      results: [],
      unseen: [],
    };
  }

  const seen = new Set(seenIds ?? (await appStore.get(resultsSeenAtom)).ids);
  await restoreCache();

  const existing = queryClient.getQueryData<InfiniteData<Page, number>>(key);
  const minimumPageCount = existing?.pages.length ?? 0;
  const data = await queryClient.fetchInfiniteQuery<
    Page,
    Error,
    Page,
    typeof key,
    number
  >({
    getNextPageParam(lastPage, allPages, _lastPageParam, allPageParams) {
      if (
        allPageParams.length >= minimumPageCount &&
        stopWhen?.(buildProgress(allPages, seen))
      ) {
        return undefined;
      }

      return paging.next(lastPage);
    },
    initialPageParam: 1,
    pages: Math.max(minimumPageCount, pageCount(maxPages)),
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitionResultsPage({
        authHeaders,
        pageParam,
        signal,
      }),
    queryKey: key,
  });

  await saveCache();

  return buildProgress(data.pages, seen);
}
