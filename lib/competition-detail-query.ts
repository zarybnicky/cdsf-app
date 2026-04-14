import type { paths } from "@/CDSF";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";

import { fetchClient, getData } from "@/lib/cdsf-client";
import { currentSessionAtom } from "@/lib/session";

type CompetitionData =
  paths["/competitions/{competitionId}"]["get"]["responses"][200]["content"]["application/json"];
type CompetitionResultData =
  paths["/competitions/{competitionId}/result"]["get"]["responses"][200]["content"]["application/json"];
type CompetitionStartlistData =
  paths["/competitions/{competitionId}/startlist"]["get"]["responses"][200]["content"]["application/json"];
type EventData =
  paths["/competition_events/{eventId}"]["get"]["responses"][200]["content"]["application/json"];

function getHeaders(token?: string) {
  return token ? { Authorization: token } : undefined;
}

function queryFamily<TKey extends string, TData>(
  key: TKey,
  invalidMessage: string,
  load: (
    id: number,
    token: string | undefined,
    signal: AbortSignal,
  ) => Promise<TData>,
) {
  return atomFamily((id: number) =>
    atomWithQuery((get) => {
      const token = get(currentSessionAtom)?.token;

      return {
        enabled: id > 0,
        queryKey: [key, id] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) => {
          if (id <= 0) {
            throw new Error(invalidMessage);
          }

          return load(id, token, signal);
        },
      };
    }),
  );
}

export const competitionDetailAtom = queryFamily(
  "competition",
  "Competition id is invalid.",
  async (competitionId, token, signal): Promise<CompetitionData> =>
    getData(
      await fetchClient.GET("/competitions/{competitionId}", {
        headers: getHeaders(token),
        params: {
          path: {
            competitionId,
          },
        },
        signal,
      }),
      "Competition response did not include data.",
    ),
);

export const competitionResultAtom = queryFamily(
  "competition-result",
  "Competition id is invalid.",
  async (competitionId, token, signal): Promise<CompetitionResultData> =>
    getData(
      await fetchClient.GET("/competitions/{competitionId}/result", {
        headers: getHeaders(token),
        params: {
          path: {
            competitionId,
          },
        },
        signal,
      }),
      "Competition result response did not include data.",
    ),
);

export const competitionStartlistAtom = queryFamily(
  "competition-startlist",
  "Competition id is invalid.",
  async (competitionId, token, signal): Promise<CompetitionStartlistData> =>
    getData(
      await fetchClient.GET("/competitions/{competitionId}/startlist", {
        headers: getHeaders(token),
        params: {
          path: {
            competitionId,
          },
        },
        signal,
      }),
      "Competition startlist response did not include data.",
    ),
);

export const competitionEventAtom = queryFamily(
  "competition-event",
  "Event id is invalid.",
  async (eventId, token, signal): Promise<EventData> =>
    getData(
      await fetchClient.GET("/competition_events/{eventId}", {
        headers: getHeaders(token),
        params: {
          path: {
            eventId,
          },
        },
        signal,
      }),
      "Competition event response did not include data.",
    ),
);
