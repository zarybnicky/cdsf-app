import createClient from "openapi-fetch";
import createQueryClient from "openapi-react-query";
import type { paths } from "@/CDSF";
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
