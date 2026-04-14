import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { FlatList, StyleSheet, View } from "react-native";

import { CompetitionActionLink } from "@/components/CompetitionScreenParts";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import {
  competitionDetailAtom,
  competitionResultAtom,
} from "@/lib/competition-detail-query";
import {
  formatCompletion,
  formatCompetitionLabel,
  formatCompetitionPlacement,
  formatCompetitorName,
  formatResultType,
} from "@/lib/competition-format";
import { listScreenStyles } from "@/lib/competition-screen-styles";
import { getRouteId } from "@/lib/competition-routes";
import { formatSimpleDate, formatSimpleDateTime } from "@/lib/cdsf";

export default function CompetitionResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    competitionId?: string | string[];
    eventId?: string | string[];
  }>();
  const competitionId = getRouteId(params.competitionId);
  const eventId = getRouteId(params.eventId);
  const competitionQuery = useAtomValue(competitionDetailAtom(competitionId ?? 0));
  const resultQuery = useAtomValue(competitionResultAtom(competitionId ?? 0));
  const competition = competitionQuery.data?.entity;
  const result = resultQuery.data?.entity;
  const rows = [...(result?.competitors ?? [])].sort((left, right) => {
    const leftRank = left.ranking ?? Number.MAX_SAFE_INTEGER;
    const rightRank = right.ranking ?? Number.MAX_SAFE_INTEGER;

    return leftRank - rightRank || left.startNumber - right.startNumber;
  });

  function refresh() {
    void Promise.all([competitionQuery.refetch(), resultQuery.refetch()]);
  }

  if (!competitionId) {
    return <Redirect href="/+not-found" />;
  }

  const title = competition ? formatCompetitionLabel(competition) : "Výsledek";
  const routeParams = eventId ? { competitionId, eventId } : { competitionId };
  const loading = competitionQuery.isLoading || resultQuery.isLoading;
  const hasError = competitionQuery.isError || resultQuery.isError || !competition;
  const isRefreshing =
    (competitionQuery.isRefetching || resultQuery.isRefetching) && !loading;
  const stateCard = loading
    ? {
        body: "Výsledek soutěže se načítá.",
        isLoading: true,
        title: "Načítám výsledek soutěže",
      }
    : hasError
      ? {
          body: "Zkuste načtení zopakovat.",
          onRetry: refresh,
          title: "Nepodařilo se načíst výsledek soutěže",
        }
      : {
          body: "Pro tuto soutěž zatím není k dispozici žádný výsledek.",
          title: "Žádný výsledek soutěže",
        };
  const header = competition && result ? (
    <View style={styles.headerCard}>
      <Text style={styles.headerTitle}>{formatCompetitionLabel(competition)}</Text>
      {competition.date ? (
        <Text style={styles.headerMeta}>{formatSimpleDate(competition.date)}</Text>
      ) : null}
      <Text style={styles.headerBody}>
        {formatResultType(result.type) ?? "Výsledek soutěže"}
        {result.completedAt
          ? ` · dokončeno ${formatSimpleDateTime(result.completedAt)}`
          : ""}
      </Text>
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
              pathname: "/competitions/[competitionId]/startlist",
              params: routeParams,
            });
          }}
          title="Startovní listina"
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
        data={rows}
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
          const title = formatCompetitorName(
            item,
            `Startovní číslo ${item.startNumber}`,
          );
          const ranking = formatCompetitionPlacement(item.ranking, item.rankingTo);
          const status = formatCompletion(item.completion?.completion);
          const meta = [
            item.club,
            title === `Startovní číslo ${item.startNumber}`
              ? undefined
              : `Start. č. ${item.startNumber}`,
            status,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{title}</Text>
                {ranking ? <Text style={styles.ranking}>{ranking}</Text> : null}
              </View>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  name: {
    ...listScreenStyles.name,
    flex: 1,
  },
  ranking: {
    color: "#2457b3",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
});
