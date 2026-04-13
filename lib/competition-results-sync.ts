import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { components, paths } from "@/CDSF";
import { fetchClient, isPagingProps, openapiClient } from "@/lib/cdsf-client";
import { queryClient, restoreCache, saveCache } from "@/lib/react-query";
import { getSeenState } from "@/lib/seen-state";

type AuthHeaders = {
  Authorization: string;
};

type Page =
  paths["/athletes/current/competitions/results"]["get"]["responses"][200]["content"]["application/json"];
type CachedPages = InfiniteData<Page, number>;

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
  email?: string | null;
  maxPages?: number;
  pageSize?: number;
  persistToCache?: boolean;
  reactQueryClient?: QueryClient;
  seenIds?: ReadonlySet<string>;
  stopWhen?: (progress: SyncProgress) => boolean;
};

export const seenNs = "competition-results";
export const pageSize = 100;
const defaultMaxPages = 3;

export function queryInit(authHeaders?: AuthHeaders, size = pageSize) {
  return {
    ...(authHeaders ? { headers: authHeaders } : {}),
    params: {
      query: {
        pageSize: size,
      },
    },
  };
}

export function flattenPages(pages: readonly Page[]) {
  return pages.flatMap((page) => page.collection || []);
}

export function getCompetitionResultSeenId(
  eventId?: number | null,
  competitionId?: number | null,
) {
  if (typeof eventId !== "number" || typeof competitionId !== "number") {
    return undefined;
  }

  return `${eventId}:${competitionId}`;
}

export function flattenPublishedCompetitionResults(
  events: readonly CompetitionResultEvent[],
) {
  const results: PublishedCompetitionResult[] = [];
  const seenResultIds = new Set<string>();

  events.forEach((event) => {
    event.competitions.forEach((competition) => {
      const id = getCompetitionResultSeenId(
        event.eventId,
        competition.competitionId,
      );

      if (!id || seenResultIds.has(id)) {
        return;
      }

      seenResultIds.add(id);
      results.push({
        id,
        competition,
        event,
      });
    });
  });

  return results;
}

function mergeData(fetched: CachedPages, existing: CachedPages | undefined) {
  if (!existing) {
    return fetched;
  }

  const pageMap = new Map<number, Page>();

  fetched.pageParams.forEach((pageParam, index) => {
    pageMap.set(pageParam, fetched.pages[index]);
  });

  existing.pageParams.forEach((pageParam, index) => {
    if (!pageMap.has(pageParam)) {
      pageMap.set(pageParam, existing.pages[index]);
    }
  });

  const pageParams = Array.from(pageMap.keys()).sort(
    (left, right) => left - right,
  );

  return {
    pageParams,
    pages: pageParams.map((pageParam) => pageMap.get(pageParam) as Page),
  } satisfies CachedPages;
}

async function fetchPage({
  authHeaders,
  page,
  pageSize: size,
}: {
  authHeaders: AuthHeaders;
  page: number;
  pageSize: number;
}) {
  const response = await fetchClient.GET(
    "/athletes/current/competitions/results",
    {
      headers: authHeaders,
      params: {
        query: {
          page,
          pageSize: size,
        },
      },
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
  email,
  maxPages = defaultMaxPages,
  pageSize: size = pageSize,
  persistToCache = true,
  reactQueryClient = queryClient,
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

  const limit = Math.max(1, Math.floor(maxPages));
  const seen = seenIds ?? (await getSeenState(seenNs, email)).ids;
  const pageParams: number[] = [];
  const pages: Page[] = [];
  let nextPage: number | undefined = 1;

  while (nextPage !== undefined && pageParams.length < limit) {
    const pageParam = nextPage;
    const page = await fetchPage({
      authHeaders,
      page: pageParam,
      pageSize: size,
    });

    pageParams.push(pageParam);
    pages.push(page);
    nextPage = isPagingProps.getNextPageParam(page);
    const events = flattenPages(pages);
    const results = flattenPublishedCompetitionResults(events);
    const unseen = results.filter((result) => !seen.has(result.id));
    const progress = {
      events,
      nextPage,
      pageParams,
      pages,
      results,
      unseen,
    } satisfies SyncProgress;

    if (stopWhen?.(progress)) {
      break;
    }
  }

  const events = flattenPages(pages);
  const results = flattenPublishedCompetitionResults(events);
  const unseen = results.filter((result) => !seen.has(result.id));
  const progress = {
    events,
    nextPage,
    pageParams,
    pages,
    results,
    unseen,
  } satisfies SyncProgress;

  if (persistToCache) {
    await restoreCache();

    const key = openapiClient.queryOptions(
      "get",
      "/athletes/current/competitions/results",
      queryInit(authHeaders, size),
    ).queryKey;
    const existing = reactQueryClient.getQueryData<CachedPages>(key);
    const next = mergeData(
      {
        pageParams: progress.pageParams,
        pages: progress.pages,
      },
      existing,
    );

    reactQueryClient.setQueryData<CachedPages>(key, next);
    await saveCache();
  }

  return progress;
}
