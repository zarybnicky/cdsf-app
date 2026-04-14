import { atomWithQuery } from "jotai-tanstack-query";

import type { paths } from "@/CDSF";
import { fetchClient, getData } from "@/lib/cdsf-client";
import { currentSessionAtom } from "@/lib/session";

type Page =
  paths["/athletes/current"]["get"]["responses"][200]["content"]["application/json"];

const key = ["profile"] as const;

export const profileAtom = atomWithQuery((get) => {
  const session = get(currentSessionAtom);

  return {
    enabled: !!session,
    queryKey: key,
    queryFn: async ({ signal }): Promise<Page> => {
      if (!session) {
        throw new Error("Session is not available.");
      }

      return getData(
        await fetchClient.GET("/athletes/current", {
          headers: {
            Authorization: session.token,
          },
          signal,
        }),
        "Profile response did not include data.",
      );
    },
  };
});
