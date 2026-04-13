import { atomWithQuery } from "jotai-tanstack-query";

import type { paths } from "@/CDSF";
import { fetchClient } from "@/lib/cdsf-client";
import { sessionValueAtom } from "@/lib/session";

type Page =
  paths["/athletes/current"]["get"]["responses"][200]["content"]["application/json"];

export const profileQueryAtom = atomWithQuery<Page>((get) => {
  const session = get(sessionValueAtom);

  return {
    enabled: !!session,
    queryKey: ["profile"] as const,
    queryFn: async ({ signal }) => {
      if (!session) {
        throw new Error("Session is not available.");
      }

      const response = await fetchClient.GET("/athletes/current", {
        headers: {
          Authorization: session.token,
        },
        signal,
      });

      if (response.error) {
        throw response.error;
      }

      if (!response.data) {
        throw new Error("Profile response did not include data.");
      }

      return response.data;
    },
  };
});
