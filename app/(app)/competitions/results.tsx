import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

import CompetitionListScreen from "@/components/CompetitionListScreen";
import {
  competitionResultsAtom,
  flattenResults,
} from "@/lib/competition-results-sync";
import { getDateMs } from "@/lib/cdsf";
import { markResultsSeenAtom } from "@/lib/seen-state";

export default function CompetitionResultsScreen() {
  const router = useRouter();
  const markResultsSeen = useSetAtom(markResultsSeenAtom);
  const query = useAtomValue(competitionResultsAtom);
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
  const events = [
    ...(data?.pages ?? []).flatMap((page) => page.collection || []),
  ].sort((left, right) => {
    const timestampDifference = getDateMs(right.date) - getDateMs(left.date);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return left.eventName.localeCompare(right.eventName, "cs");
  });
  const stateCard = isLoading
    ? {
        body: "Přehled soutěží se načítá.",
        isLoading: true,
        title: "Načítám přehled soutěží",
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
          body: "Jakmile budou zveřejněny výsledky soutěží, zobrazí se zde.",
          title: "Žádné výsledky soutěží",
        };

  useEffect(() => {
    if (isLoading || isError) {
      return;
    }

    const seenIds = flattenResults(events).map(({ id }) => id);

    if (seenIds.length > 0) {
      void markResultsSeen(seenIds);
    }
  }, [events, isError, isLoading, markResultsSeen]);

  return (
    <CompetitionListScreen
      events={events}
      isFetchingNextPage={isFetchingNextPage}
      isRefreshing={isRefetching && !isLoading}
      onEndReached={hasNextPage ? () => void fetchNextPage() : undefined}
      onPressCompetition={(competitionId, eventId) => {
        const params =
          eventId > 0 ? { competitionId, eventId } : { competitionId };

        router.push({
          pathname: "/competitions/[competitionId]/result",
          params,
        });
      }}
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
      tab="results"
    />
  );
}
