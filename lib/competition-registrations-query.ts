import type { InfiniteData } from "@tanstack/react-query";
import { atomWithInfiniteQuery } from "jotai-tanstack-query";

import type { paths } from "@/CDSF";
import { fetchClient, isPagingProps } from "@/lib/cdsf-client";
import { sessionValueAtom } from "@/lib/session";

type Page =
  paths["/athletes/current/competitions/registrations"]["get"]["responses"][200]["content"]["application/json"];

const competitionPageSize = 100;

export const competitionRegistrationsInfiniteQueryAtom =
  atomWithInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page, number>,
    readonly ["competition-registrations"],
    number
  >(
    (get) => {
      const session = get(sessionValueAtom);

      return {
        enabled: !!session,
        getNextPageParam(lastPage) {
          return isPagingProps.getNextPageParam(lastPage);
        },
        initialPageParam: 1,
        queryKey: ["competition-registrations"] as const,
        queryFn: async ({ pageParam, signal }) => {
          if (!session) {
            throw new Error("Session is not available.");
          }

          const response = await fetchClient.GET(
            "/athletes/current/competitions/registrations",
            {
              headers: {
                Authorization: session.token,
              },
              params: {
                query: {
                  page: pageParam,
                  pageSize: competitionPageSize,
                },
              },
              signal,
            },
          );

          if (response.error) {
            throw response.error;
          }

          if (!response.data) {
            throw new Error(
              "Competition registrations response did not include data.",
            );
          }

          return response.data;
        },
      };
    },
  );
