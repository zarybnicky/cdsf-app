import type { InfiniteData, QueryKey } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";

import { queryClient, restoreCache, saveCache } from "@/lib/react-query";

type InfiniteQuerySnapshot<TPage, TPageParam> = {
  pageParams: TPageParam[];
  pages: TPage[];
};

type FetchInfiniteProgressInput<TPage, TPageParam, TProgress> = {
  buildProgress: (
    snapshot: InfiniteQuerySnapshot<TPage, TPageParam>,
  ) => TProgress;
  fetchPage: (input: {
    pageParam: TPageParam;
    signal: AbortSignal;
  }) => Promise<TPage>;
  getNextPageParam: (
    snapshot: InfiniteQuerySnapshot<TPage, TPageParam>,
  ) => TPageParam | undefined;
  initialPageParam: TPageParam;
  maxPages: number;
  persistToCache?: boolean;
  queryKey: QueryKey;
  stopWhen?: (progress: TProgress) => boolean;
};

export function mergeInfiniteData<TPage, TPageParam>(
  fetched: InfiniteData<TPage, TPageParam>,
  existing: InfiniteData<TPage, TPageParam> | undefined,
) {
  if (!existing) {
    return fetched;
  }

  const pageMap = new Map<TPageParam, TPage>();

  fetched.pageParams.forEach((pageParam, index) => {
    pageMap.set(pageParam, fetched.pages[index]);
  });

  existing.pageParams.forEach((pageParam, index) => {
    if (!pageMap.has(pageParam)) {
      pageMap.set(pageParam, existing.pages[index]);
    }
  });

  const pageParams = Array.from(pageMap.keys()).sort(
    (left, right) => Number(left) - Number(right),
  );

  return {
    pageParams,
    pages: pageParams.map((pageParam) => pageMap.get(pageParam) as TPage),
  } satisfies InfiniteData<TPage, TPageParam>;
}

function normalizeMaxPages(maxPages: number) {
  if (!Number.isFinite(maxPages)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(1, Math.floor(maxPages));
}

export async function fetchInfiniteProgress<TPage, TPageParam, TProgress>({
  buildProgress,
  fetchPage,
  getNextPageParam,
  initialPageParam,
  maxPages,
  persistToCache = true,
  queryKey,
  stopWhen,
}: FetchInfiniteProgressInput<TPage, TPageParam, TProgress>) {
  const fetchQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const fetched = await fetchQueryClient.fetchInfiniteQuery<
    TPage,
    Error,
    TPage,
    QueryKey,
    TPageParam
  >({
    queryKey,
    initialPageParam,
    pages: normalizeMaxPages(maxPages),
    queryFn: ({ pageParam, signal }) =>
      fetchPage({
        pageParam: pageParam as TPageParam,
        signal,
      }),
    getNextPageParam(_lastPage, allPages, _lastPageParam, allPageParams) {
      const snapshot = {
        pageParams: [...allPageParams],
        pages: [...allPages],
      } satisfies InfiniteQuerySnapshot<TPage, TPageParam>;

      if (stopWhen?.(buildProgress(snapshot))) {
        return undefined;
      }

      return getNextPageParam(snapshot);
    },
  });

  const snapshot = {
    pageParams: [...fetched.pageParams],
    pages: [...fetched.pages],
  } satisfies InfiniteQuerySnapshot<TPage, TPageParam>;
  const progress = buildProgress(snapshot);

  if (persistToCache) {
    await restoreCache();

    const existing =
      queryClient.getQueryData<InfiniteData<TPage, TPageParam>>(queryKey);
    const next = mergeInfiniteData(fetched, existing);

    queryClient.setQueryData<InfiniteData<TPage, TPageParam>>(queryKey, next);
    await saveCache();
  }

  return progress;
}
