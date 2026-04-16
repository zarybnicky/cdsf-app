import { useQuery } from "@tanstack/react-query";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import { FlatList, StyleSheet, View } from "react-native";

import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { fetchClient, getData } from "@/lib/cdsf-client";
import {
  formatCompetitionLabel,
  formatCompetitorName,
  formatPresence,
  formatCompetitorSource,
} from "@/lib/competition-format";
import { competitionQueryOptions } from "@/lib/competition-query";
import { listScreenStyles } from "@/lib/competition-screen-styles";
import { getRouteId } from "@/lib/competition-routes";
import { withHeaderSubtitle } from "@/lib/navigation-header";
import { formatSimpleDate } from "@/lib/cdsf";
import { currentSessionAtom } from "@/lib/session";

export default function CompetitionStartlistScreen() {
  const params = useLocalSearchParams<{
    competitionId?: string | string[];
  }>();
  const competitionId = getRouteId(params.competitionId);
  const session = useAtomValue(currentSessionAtom);
  const competitionQuery = useQuery({
    ...competitionQueryOptions(competitionId, session?.token),
    enabled: !!competitionId,
  });
  const startlistQuery = useQuery({
    enabled: !!competitionId,
    queryKey: ["competition-startlist", competitionId] as const,
    queryFn: async ({ signal }) => {
      if (!competitionId) {
        throw new Error("Competition id is invalid.");
      }

      return getData(
        await fetchClient.GET("/competitions/{competitionId}/startlist", {
          headers: session ? { Authorization: session.token } : undefined,
          params: {
            path: {
              competitionId,
            },
          },
          signal,
        }),
        "Competition startlist response did not include data.",
      );
    },
  });
  const competition = competitionQuery.data?.entity;
  const competitors = startlistQuery.data?.collection ?? [];

  function refresh() {
    void Promise.all([competitionQuery.refetch(), startlistQuery.refetch()]);
  }

  if (!competitionId) {
    return <Redirect href="/+not-found" />;
  }

  const title = competition
    ? formatCompetitionLabel(competition)
    : "Startovní listina";
  const loading = competitionQuery.isLoading || startlistQuery.isLoading;
  const hasError =
    competitionQuery.isError || startlistQuery.isError || !competition;
  const isRefreshing =
    (competitionQuery.isRefetching || startlistQuery.isRefetching) && !loading;
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
        onRefresh={refresh}
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
