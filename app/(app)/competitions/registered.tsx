import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

import CompetitionListScreen from "@/components/CompetitionListScreen";
import { getDateMs } from "@/lib/cdsf";
import { competitionRegistrationsQueryOptions } from "@/lib/competition-registrations-query";
import { currentSessionAtom } from "@/lib/session";

export default function RegisteredCompetitionsScreen() {
  const router = useRouter();
  const token = useAtomValue(currentSessionAtom)?.token;
  const query = useInfiniteQuery({
    ...competitionRegistrationsQueryOptions(token),
    enabled: !!token,
  });
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = query;
  const registrationsStart = new Date();
  registrationsStart.setHours(0, 0, 0, 0);
  registrationsStart.setDate(registrationsStart.getDate() - 1);
  const registrationsStartMs = registrationsStart.getTime();
  const allEvents = (data?.pages ?? []).flatMap((page) => page.collection || []);
  const newestEventMs = allEvents.reduce(
    (latestMs, event) => Math.max(latestMs, getDateMs(event.date)),
    Number.NEGATIVE_INFINITY,
  );
  const isSeekingCurrentWindow =
    !!hasNextPage &&
    !isLoading &&
    !isFetchingNextPage &&
    !isError &&
    newestEventMs < registrationsStartMs;
  const hasReachedCurrentWindow =
    newestEventMs >= registrationsStartMs || !hasNextPage;
  const events = allEvents
    .filter((event) => getDateMs(event.date) >= registrationsStartMs)
    .sort((left, right) => {
      const timestampDifference = getDateMs(left.date) - getDateMs(right.date);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return left.eventName.localeCompare(right.eventName, "cs");
    });
  const stateCard =
    isLoading || !hasReachedCurrentWindow
      ? {
          body: isSeekingCurrentWindow
            ? "Vyhledávám nejnovější přihlášky."
            : "Přehled soutěží se načítá.",
          isLoading: true,
          title: isSeekingCurrentWindow
            ? "Načítám aktuální přihlášky"
            : "Načítám přehled soutěží",
        }
      : isError
        ? {
            body: "Zkuste načtení zopakovat.",
            onRetry: () => {
              void refetch();
            },
            title: "Nepodařilo se načíst přehled soutěží",
          }
        : {
            body: "Jakmile budou přihlášky na soutěže evidovány, zobrazí se zde.",
            title: "Žádné přihlášky na soutěže",
          };

  useEffect(() => {
    if (!isSeekingCurrentWindow) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, isSeekingCurrentWindow]);

  return (
    <CompetitionListScreen
      events={events}
      isFetchingNextPage={isFetchingNextPage}
      isRefreshing={isRefetching && !isLoading}
      onEndReached={hasNextPage ? () => void fetchNextPage() : undefined}
      onPressEvent={(eventId) => {
        router.push({
          pathname: "/competitions/events/[eventId]",
          params: { eventId },
        });
      }}
      onRefresh={() => {
        void refetch();
      }}
      stateCard={stateCard}
      tab="registered"
    />
  );
}
