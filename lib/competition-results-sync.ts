import type { components, paths } from "@/CDSF";
import type { InfiniteData } from "@tanstack/react-query";
import { atomWithInfiniteQuery } from "jotai-tanstack-query";

import { appStore } from "@/lib/app-store";
import { fetchClient, isPagingProps } from "@/lib/cdsf-client";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import { sessionValueAtom } from "@/lib/session";
import { competitionResultsSeenStateAtom } from "@/lib/seen-state";

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
  pageParams: number[];
  pages: Page[];
  results: PublishedCompetitionResult[];
  unseen: PublishedCompetitionResult[];
};

export type SyncInput = {
  authHeaders?: {
    Authorization: string;
  };
  maxPages?: number;
  seenIds?: ReadonlySet<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
};

const pageSize = 100;
const defaultMaxPages = 3;

export function flattenPublishedCompetitionResults(
  events: readonly CompetitionResultEvent[],
) {
  const results: PublishedCompetitionResult[] = [];
  const seenResultIds = new Set<string>();

  events.forEach((event) => {
    event.competitions.forEach((competition) => {
      const id =
        typeof event.eventId !== "number"
          ? undefined
          : `${event.eventId}:${competition.competitionId}`;
      if (id && !seenResultIds.has(id)) {
        seenResultIds.add(id);
        results.push({ id, competition, event });
      }
    });
  });

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
  const response = await fetchClient.GET(
    "/athletes/current/competitions/results",
    {
      headers: authHeaders,
      params: {
        query: {
          page: pageParam,
          pageSize,
        },
      },
      signal,
    },
  );
  if (response.error) {
    throw response.error;
  }
  if (!response.data) {
    throw new Error("Competition results response did not include data.");
  }
  return response.data;
}

export const competitionResultsInfiniteQueryAtom =
  atomWithInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page, number>,
    readonly ["competition-results"],
    number
  >(
    (get) => {
      const session = get(sessionValueAtom);

      return {
        enabled: !!session,
        getNextPageParam(lastPage) {
          return isPagingProps.getNextPageParam(lastPage);
        },
        initialPageParam: 1,
        queryKey: ["competition-results"] as const,
        queryFn: async ({ pageParam, signal }) => {
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
    },
  );

function normalizeMaxPages(maxPages: number) {
  if (!Number.isFinite(maxPages)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(1, Math.floor(maxPages));
}

function buildSyncProgress(
  pages: Page[],
  pageParams: number[],
  seen: ReadonlySet<string>,
) {
  const events = pages.flatMap((page) => page.collection || []);
  const results = flattenPublishedCompetitionResults(events);
  const latestPage = pages.at(-1);

  return {
    events,
    nextPage: latestPage ? isPagingProps.getNextPageParam(latestPage) : undefined,
    pageParams,
    pages,
    results,
    unseen: results.filter((result) => !seen.has(result.id)),
  } satisfies SyncProgress;
}

export async function syncCompetitionResults({
  authHeaders,
  maxPages = defaultMaxPages,
  seenIds,
  stopWhen,
}: SyncInput): Promise<SyncProgress> {
  if (!authHeaders) {
    return {
      events: [],
      nextPage: undefined,
      pageParams: [],
      pages: [],
      results: [],
      unseen: [],
    };
  }

  const seen =
    seenIds ?? (await appStore.get(competitionResultsSeenStateAtom)).ids;
  await restoreCache();

  const existing = queryClient.getQueryData<InfiniteData<Page, number>>([
    "competition-results",
  ]);
  const minimumPageCount = existing?.pages.length ?? 0;
  const data = await queryClient.fetchInfiniteQuery<
    Page,
    Error,
    Page,
    readonly ["competition-results"],
    number
  >({
    getNextPageParam(lastPage, allPages, _lastPageParam, allPageParams) {
      if (
        allPageParams.length >= minimumPageCount &&
        stopWhen?.(buildSyncProgress(allPages, allPageParams, seen))
      ) {
        return undefined;
      }

      return isPagingProps.getNextPageParam(lastPage);
    },
    initialPageParam: 1,
    pages: Math.max(minimumPageCount, normalizeMaxPages(maxPages)),
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitionResultsPage({
        authHeaders,
        pageParam,
        signal,
      }),
    queryKey: ["competition-results"] as const,
  });

  await saveCache();

  return buildSyncProgress(data.pages, data.pageParams, seen);
}
