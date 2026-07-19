import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useState } from "react";

import CompetitionListScreen from "@/components/CompetitionListScreen";
import { recentResultsAtom, syncStateAtom } from "@/lib/atoms";
import { sync } from "@/lib/sync";

export default function CompetitionResultsScreen() {
  const router = useRouter();
  const events = useAtomValue(recentResultsAtom);
  const syncState = useAtomValue(syncStateAtom).results;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isLoading =
    events.length === 0 &&
    syncState.lastSync === null &&
    syncState.lastError === null;
  const stateCard = isLoading
    ? {
        body: "Přehled soutěží se načítá.",
        isLoading: true,
        title: "Načítám přehled soutěží",
      }
    : syncState.lastError
      ? {
          body: "Zkuste načtení zopakovat.",
          onRetry: () => {
            void refresh();
          },
          title: "Nepodařilo se načíst přehled soutěží",
        }
      : {
          body: "Jakmile budou zveřejněny výsledky soutěží, zobrazí se zde.",
          title: "Žádné výsledky soutěží",
        };

  async function refresh() {
    setIsRefreshing(true);
    try {
      await sync({ trigger: "manual", domains: ["results"] }).catch(() => {});
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <CompetitionListScreen
      events={events}
      isRefreshing={isRefreshing}
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
        void refresh();
      }}
      stateCard={stateCard}
      tab="results"
    />
  );
}
