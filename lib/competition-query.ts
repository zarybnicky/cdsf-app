import { queryOptions } from "@tanstack/react-query";

import type { paths } from "@/CDSF";
import { fetchClient, getData } from "@/lib/cdsf-client";

type Page =
  paths["/competitions/{competitionId}"]["get"]["responses"][200]["content"]["application/json"];

export function competitionQueryOptions(
  competitionId?: number | null,
  token?: string,
) {
  return queryOptions({
    queryKey: ["competition", competitionId] as const,
    queryFn: async ({ signal }): Promise<Page> => {
      if (!competitionId) {
        throw new Error("Competition id is invalid.");
      }

      return getData(
        await fetchClient.GET("/competitions/{competitionId}", {
          headers: token ? { Authorization: token } : undefined,
          params: {
            path: {
              competitionId,
            },
          },
          signal,
        }),
        "Competition response did not include data.",
      );
    },
  });
}
