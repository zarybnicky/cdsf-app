import { infiniteQueryOptions } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";

import type { components, paths } from "@/CDSF";
import { appStore } from "@/lib/app-store";
import { fetchClient, getData, pageCount, paging } from "@/lib/cdsf-client";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import { resultsSeenAtom } from "@/lib/seen-state";

type Page =
  paths["/athletes/current/competitions/results"]["get"]["responses"][200]["content"]["application/json"];

type CompetitionResultEvent = components["schemas"]["EventRegistration"];
type CompetitionResultCompetition =
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
  maxPages?: number;
  seenIds?: Iterable<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
  token?: string;
};

const pageSize = 100;
const defaultPages = 3;

export const competitionResultsQueryKey = ["competition-results"] as const;

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
  page,
  signal,
  token,
}: {
  page: number;
  signal?: AbortSignal;
  token: string;
}) {
  return getData(
    await fetchClient.GET("/athletes/current/competitions/results", {
      headers: {
        Authorization: token,
      },
      params: {
        query: {
          page,
          pageSize,
        },
      },
      signal,
    }),
    "Competition results response did not include data.",
  );
}

export function competitionResultsQueryOptions(token?: string) {
  return infiniteQueryOptions({
    getNextPageParam: paging.next,
    initialPageParam: 1,
    queryKey: competitionResultsQueryKey,
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal: AbortSignal;
    }): Promise<Page> => {
      if (!token) {
        throw new Error("Session is not available.");
      }

      return fetchCompetitionResultsPage({
        page: pageParam,
        signal,
        token,
      });
    },
  });
}

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
  maxPages = defaultPages,
  seenIds,
  stopWhen,
  token,
}: SyncInput): Promise<SyncProgress> {
  if (!token) {
    return {
      events: [],
      nextPage: undefined,
      results: [],
      unseen: [],
    };
  }

  const seen = new Set(seenIds ?? (await appStore.get(resultsSeenAtom)).ids);
  await restoreCache();

  const existing = queryClient.getQueryData<InfiniteData<Page, number>>(
    competitionResultsQueryKey,
  );
  const minimumPageCount = existing?.pages.length ?? 0;
  const data = await queryClient.fetchInfiniteQuery({
    ...competitionResultsQueryOptions(token),
    getNextPageParam(lastPage, allPages, _lastPageParam, allPageParams) {
      if (
        allPageParams.length >= minimumPageCount &&
        stopWhen?.(buildProgress(allPages, seen))
      ) {
        return undefined;
      }

      return paging.next(lastPage);
    },
    pages: Math.max(minimumPageCount, pageCount(maxPages)),
  });

  await saveCache();

  return buildProgress(data.pages, seen);
}
