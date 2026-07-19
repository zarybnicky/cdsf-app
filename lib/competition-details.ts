import { appStore } from "./app-store";
import {
  competitionsAtom,
  eventsAtom,
  resultsFullAtom,
  startlistsAtom,
} from "./atoms";
import { apiClient, fetchData } from "./api";

const store = appStore;

export async function refreshCompetitionEvent(eventId: number): Promise<void> {
  const response = await fetchData(
    apiClient.GET("/competition_events/{eventId}", {
      params: { path: { eventId } },
    }),
  );
  const event = response.entity;
  if (event) {
    store.set(eventsAtom, (current) => ({ ...current, [eventId]: event }));
  }
}

export async function refreshCompetitionStartlist(
  competitionId: number,
): Promise<void> {
  const [{ entity: competition }, startlistResponse] = await Promise.all([
    fetchData(
      apiClient.GET("/competitions/{competitionId}", {
        params: { path: { competitionId } },
      }),
    ),
    fetchData(
      apiClient.GET("/competitions/{competitionId}/startlist", {
        params: { path: { competitionId } },
      }),
    ),
  ]);
  if (competition) {
    store.set(competitionsAtom, (current) => ({
      ...current,
      [competitionId]: competition,
    }));
  }
  store.set(startlistsAtom, (current) => ({
    ...current,
    [competitionId]: startlistResponse.collection ?? [],
  }));
}

export async function refreshCompetitionResult(
  competitionId: number,
): Promise<void> {
  const response = await fetchData(
    apiClient.GET("/competitions/{competitionId}/result", {
      params: { path: { competitionId } },
    }),
  );
  const result = response.entity;
  if (result) {
    store.set(resultsFullAtom, (current) => ({
      ...current,
      [competitionId]: result,
    }));
  }
}
