import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

import CompetitionListScreen from "@/components/CompetitionListScreen";
import { competitionRegistrationsAtom } from "@/lib/competition-registrations-query";
import { getDateMs } from "@/lib/cdsf";

export default function RegisteredCompetitionsScreen() {
  const router = useRouter();
  const query = useAtomValue(competitionRegistrationsAtom);
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
  const registrationsStartMs = getRegistrationsStartMs();
  const allEvents = (data?.pages ?? []).flatMap((page) => page.collection || []);
  const newestEventMs = allEvents.reduce(
    (latestMs, event) => Math.max(latestMs, getDateMs(event.date)),
    Number.NEGATIVE_INFINITY,
  );
  const seekingCurrentRegistrations =
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
  const stateCard = isLoading || !hasReachedCurrentWindow
    ? {
        body: seekingCurrentRegistrations
          ? "Vyhledávám nejnovější přihlášky."
          : "Přehled soutěží se načítá.",
        isLoading: true,
        title: seekingCurrentRegistrations
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
    if (!hasNextPage || isLoading || isFetchingNextPage || isError) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isError, isFetchingNextPage, isLoading]);

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

function getRegistrationsStartMs() {
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  return yesterday.getTime();
}
