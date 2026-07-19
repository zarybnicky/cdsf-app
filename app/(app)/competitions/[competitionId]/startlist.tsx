import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { competitionsAtom, startlistsAtom } from "@/lib/atoms";
import {
  formatCompetitionLabel,
  formatCompetitorName,
  formatPresence,
  formatCompetitorSource,
} from "@/lib/competition-format";
import { listScreenStyles } from "@/lib/competition-screen-styles";
import { withHeaderSubtitle } from "@/lib/navigation-header";
import { formatSimpleDate } from "@/lib/cdsf";
import { refreshCompetitionStartlist } from "@/lib/competition-details";

export default function CompetitionStartlistScreen() {
  const params = useLocalSearchParams<{
    competitionId?: string;
  }>();
  const parsedCompetitionId = Number(params.competitionId);
  const competitionId =
    Number.isInteger(parsedCompetitionId) && parsedCompetitionId > 0
      ? parsedCompetitionId
      : null;
  const competitions = useAtomValue(competitionsAtom);
  const startlists = useAtomValue(startlistsAtom);
  const competition = competitions[competitionId ?? 0];
  const competitors = startlists[competitionId ?? 0] ?? [];
  const hasCachedStartlist =
    competitionId !== null && competitionId in startlists;
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    competition && hasCachedStartlist ? "ready" : "loading",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!competitionId) return;
    void refreshCompetitionStartlist(competitionId).then(
      () => setLoadState("ready"),
      () => setLoadState("error"),
    );
  }, [competitionId]);

  async function refresh() {
    if (!competitionId) return;
    setIsRefreshing(true);
    try {
      await refreshCompetitionStartlist(competitionId);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    } finally {
      setIsRefreshing(false);
    }
  }

  if (!competitionId) {
    return <Redirect href="/+not-found" />;
  }

  const title = competition
    ? formatCompetitionLabel(competition)
    : "Startovní listina";
  const loading = loadState === "loading" && !hasCachedStartlist;
  const hasError = loadState === "error" && !hasCachedStartlist;
  const stateCard = loading
    ? {
        body: "Startovní listina soutěže se načítá.",
        isLoading: true,
        title: "Načítám startovní listinu",
      }
    : hasError
      ? {
          body: "Zkuste načtení zopakovat.",
          onRetry: refresh,
          title: "Nepodařilo se načíst startovní listinu",
        }
      : {
          body: "Pro tuto soutěž zatím nejsou k dispozici žádné položky.",
          title: "Žádné položky ve startovní listině",
        };
  const summary = competition
    ? [
        competition.date ? formatSimpleDate(competition.date) : undefined,
        typeof competition.registered === "number"
          ? `Přihlášeno ${competition.registered}`
          : undefined,
        typeof competition.excused === "number"
          ? `Omluveno ${competition.excused}`
          : undefined,
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <View style={styles.container}>
      <Stack.Screen options={withHeaderSubtitle(title, summary)} />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={competitors}
        keyExtractor={(item) => item.competitorId.toString()}
        ListEmptyComponent={
          <ScreenStateCard
            body={stateCard.body}
            isLoading={stateCard.isLoading}
            onRetry={stateCard.onRetry}
            style={styles.stateCard}
            title={stateCard.title}
          />
        }
        onRefresh={() => void refresh()}
        refreshing={isRefreshing}
        renderItem={({ item }) => {
          const meta = [
            formatCompetitorSource(item),
            formatPresence(item.presence),
            item.startsWithRound && item.startsWithRound > 1
              ? `Od ${item.startsWithRound}. kola`
              : undefined,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <View style={styles.row}>
              <Text style={styles.name}>{formatCompetitorName(item)}</Text>
              {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ...listScreenStyles,
});
