import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { FlatList, StyleSheet, View } from "react-native";

import { CompetitionActionLink } from "@/components/CompetitionScreenParts";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import {
  competitionDetailAtom,
  competitionStartlistAtom,
} from "@/lib/competition-detail-query";
import {
  formatCompetitionLabel,
  formatCompetitorName,
  formatPresence,
  formatCompetitorSource,
} from "@/lib/competition-format";
import { listScreenStyles } from "@/lib/competition-screen-styles";
import { getRouteId } from "@/lib/competition-routes";
import { formatSimpleDate } from "@/lib/cdsf";

export default function CompetitionStartlistScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    competitionId?: string | string[];
    eventId?: string | string[];
  }>();
  const competitionId = getRouteId(params.competitionId);
  const eventId = getRouteId(params.eventId);
  const competitionQuery = useAtomValue(competitionDetailAtom(competitionId ?? 0));
  const startlistQuery = useAtomValue(competitionStartlistAtom(competitionId ?? 0));
  const competition = competitionQuery.data?.entity;
  const competitors = startlistQuery.data?.collection ?? [];

  function refresh() {
    void Promise.all([competitionQuery.refetch(), startlistQuery.refetch()]);
  }

  if (!competitionId) {
    return <Redirect href="/+not-found" />;
  }

  const title = competition ? formatCompetitionLabel(competition) : "Startovní listina";
  const routeParams = eventId ? { competitionId, eventId } : { competitionId };
  const loading = competitionQuery.isLoading || startlistQuery.isLoading;
  const hasError = competitionQuery.isError || startlistQuery.isError || !competition;
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
  const header = competition ? (
    <View style={styles.headerCard}>
      <Text style={styles.headerTitle}>{formatCompetitionLabel(competition)}</Text>
      {competition.date ? (
        <Text style={styles.headerMeta}>{formatSimpleDate(competition.date)}</Text>
      ) : null}
      <View style={styles.actionRow}>
        <CompetitionActionLink
          onPress={() => {
            router.replace({
              pathname: "/competitions/[competitionId]",
              params: routeParams,
            });
          }}
          title="Přehled soutěže"
        />
        <CompetitionActionLink
          onPress={() => {
            router.replace({
              pathname: "/competitions/[competitionId]/result",
              params: routeParams,
            });
          }}
          title="Výsledek"
        />
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <ListTopShadow />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={competitors}
        keyExtractor={(item) => item.competitorId.toString()}
        ListHeaderComponent={header}
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
            <View style={styles.card}>
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
  headerTitle: {
    color: "#223045",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
});
