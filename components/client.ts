import createClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { components, paths } from "@/CDSF";
import { QueryClient } from '@tanstack/react-query';

export const client = createClient<paths>({ baseUrl: "https://www.csts.cz/api/1" });
export const openapiClient = createQueryClient<paths>(client);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: process.env.NODE_ENV === 'development' ? {
      staleTime: 0,
      gcTime: 0,
    } : {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 60 * 24, // 1 day
    },
  },
})

export const isPagingProps = {
  pageParamName: "page",
  initialPageParam: 1,
  getNextPageParam(lastPage: { paging?: components['schemas']['Paging'] } | undefined) {
    const {
      totalCount = 0,
      pageSize = 5,
      page = 0,
    } = lastPage?.paging || {};
    return totalCount > pageSize * page ? page + 1 : undefined;
  },
};
