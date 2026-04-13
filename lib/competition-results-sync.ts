import type { components, paths } from "@/CDSF";
import { appStore } from "@/lib/app-store";
import { fetchClient, isPagingProps, openapiClient } from "@/lib/cdsf-client";
import { fetchInfiniteProgress } from "@/lib/infinite-query-sync";
import { competitionResultsSeenStateAtom } from "@/lib/seen-state";

type AuthHeaders = {
  Authorization: string;
};

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
  authHeaders?: AuthHeaders;
  maxPages?: number;
  pageSize?: number;
  persistToCache?: boolean;
  seenIds?: ReadonlySet<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
};

const pageSize = 100;
const defaultMaxPages = 3;

export function queryInit(authHeaders?: AuthHeaders) {
  return {
    ...(authHeaders ? { headers: authHeaders } : {}),
    params: {
      query: {
        pageSize,
      },
    },
  };
}

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

async function fetchPage({
  authHeaders,
  pageParam,
  signal,
}: {
  authHeaders: AuthHeaders;
  pageParam: number;
  signal: AbortSignal;
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

export async function syncCompetitionResults({
  authHeaders,
  maxPages = defaultMaxPages,
  persistToCache = true,
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
  const queryKey = openapiClient.queryOptions(
    "get",
    "/athletes/current/competitions/results",
    queryInit(authHeaders),
  ).queryKey;

  return fetchInfiniteProgress<Page, number, SyncProgress>({
    buildProgress({ pages, pageParams }) {
      const events = pages.flatMap((page) => page.collection || []);
      const results = flattenPublishedCompetitionResults(events);
      const latestPage = pages.at(-1);

      return {
        events,
        nextPage: latestPage
          ? isPagingProps.getNextPageParam(latestPage)
          : undefined,
        pageParams,
        pages,
        results,
        unseen: results.filter((result) => !seen.has(result.id)),
      } satisfies SyncProgress;
    },
    fetchPage: ({ pageParam, signal }) =>
      fetchPage({
        authHeaders,
        pageParam,
        signal,
      }),
    getNextPageParam({ pages }) {
      const latestPage = pages.at(-1);
      return latestPage
        ? isPagingProps.getNextPageParam(latestPage)
        : undefined;
    },
    initialPageParam: 1,
    maxPages,
    persistToCache,
    queryKey,
    stopWhen,
  });
}
