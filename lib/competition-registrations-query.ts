import { atomWithInfiniteQuery } from "jotai-tanstack-query";

import type { paths } from "@/CDSF";
import { fetchClient, getData, paging } from "@/lib/cdsf-client";
import { currentSessionAtom } from "@/lib/session";

type Page =
  paths["/athletes/current/competitions/registrations"]["get"]["responses"][200]["content"]["application/json"];

const pageSize = 100;
const key = ["competition-registrations"] as const;

export const competitionRegistrationsAtom = atomWithInfiniteQuery((get) => {
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

      return getData(
        await fetchClient.GET("/athletes/current/competitions/registrations", {
          headers: {
            Authorization: session.token,
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
  };
});
