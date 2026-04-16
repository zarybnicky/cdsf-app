import { infiniteQueryOptions } from "@tanstack/react-query";

import type { paths } from "@/CDSF";
import { fetchClient, getData, paging } from "@/lib/cdsf-client";

type Page =
  paths["/athletes/current/competitions/registrations"]["get"]["responses"][200]["content"]["application/json"];

const pageSize = 100;

export const competitionRegistrationsQueryKey = [
  "competition-registrations",
] as const;

export function competitionRegistrationsQueryOptions(token?: string) {
  return infiniteQueryOptions({
    getNextPageParam: paging.next,
    initialPageParam: 1,
    queryKey: competitionRegistrationsQueryKey,
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

      return getData(
        await fetchClient.GET("/athletes/current/competitions/registrations", {
          headers: {
            Authorization: token,
          },
          params: {
            query: {
              page: pageParam,
              pageSize,
            },
          },
          signal,
        }),
        "Competition registrations response did not include data.",
      );
    },
  });
}
