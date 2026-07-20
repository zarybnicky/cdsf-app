import { Platform } from "react-native";

import { appStore } from "./app-store";
import {
  competitionsAtom,
  eventsAtom,
  resultsFullAtom,
  startlistsAtom,
} from "./atoms";
import { API_BASE_URL, ApiError, apiClient, fetchData } from "./api";
import type { EventDetails } from "./types";

type PublishedEventsResponse = {
  collection: Array<{
    id: number;
    eventCompetitions: EventDetails[];
  }>;
};

const store = appStore;

export async function refreshCompetitionEvent(eventId: number): Promise<void> {
  const response = await fetchData(
    apiClient.GET("/competition_events/{eventId}", {
      params: { path: { eventId } },
    }),
  );
  const event = response.entity;
  if (!event) return;

  const filter = `date>=${event.dateFrom} AND date<=${event.dateTo ?? event.dateFrom}`;
  const eventsUrl =
    Platform.OS === "web" ? "/api/1/events" : `${API_BASE_URL}/events`;
  const publishedResponse = await fetch(
    `${eventsUrl}?${new URLSearchParams({ filter })}`,
  );
  const publishedEvents =
    (await publishedResponse.json()) as PublishedEventsResponse;

  if (!publishedResponse.ok) {
    throw new ApiError(publishedResponse, publishedEvents);
  }

  const details = publishedEvents.collection.find((item) => item.id === eventId)
    ?.eventCompetitions[0];

  if (!details) {
    throw new Error(
      `Event ${eventId} has no details in the published event list`,
    );
  }

  store.set(eventsAtom, (current) => ({
    ...current,
    [eventId]: { ...event, details },
  }));
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
  const [{ entity: competition }, { entity: result }] = await Promise.all([
    fetchData(
      apiClient.GET("/competitions/{competitionId}", {
        params: { path: { competitionId } },
      }),
    ),
    fetchData(
      apiClient.GET("/competitions/{competitionId}/result", {
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
  if (result) {
    store.set(resultsFullAtom, (current) => ({
      ...current,
      [competitionId]: result,
    }));
  }
}
