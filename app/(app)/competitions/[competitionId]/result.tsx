import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import { FlatList, StyleSheet, View } from "react-native";

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
} from "@/lib/competition-format";
import { listScreenStyles } from "@/lib/competition-screen-styles";
import { getRouteId } from "@/lib/competition-routes";
import { withHeaderSubtitle } from "@/lib/navigation-header";
import { formatSimpleDate, formatSimpleDateTime } from "@/lib/cdsf";

export default function CompetitionResultScreen() {
  const params = useLocalSearchParams<{
    competitionId?: string | string[];
  }>();
  const competitionId = getRouteId(params.competitionId);
  const competitionQuery = useAtomValue(
    competitionDetailAtom(competitionId ?? 0),
  );
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
  const loading = competitionQuery.isLoading || resultQuery.isLoading;
  const hasError =
    competitionQuery.isError || resultQuery.isError || !competition;
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
  const summary = competition
    ? [
        competition.date ? formatSimpleDate(competition.date) : undefined,
        result?.completedAt
          ? `dokončeno ${formatSimpleDateTime(result.completedAt)}`
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
        data={rows}
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
        renderItem={({ item, index }) => {
          const fallbackTitle = `Startovní číslo ${item.startNumber}`;
          const title = formatCompetitorName(item.competitor, fallbackTitle);
          const ranking = formatCompetitionPlacement(
            item.ranking,
            item.rankingTo,
          );
          const status = formatCompletion(item.completion?.completion);
          const source =
            item.club ??
            item.competitor?.club ??
            item.country ??
            item.competitor?.country;
          const meta = [
            source,
            title === fallbackTitle
              ? undefined
              : `Start. č. ${item.startNumber}`,
            status,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <View
              style={[
                styles.resultRow,
                index === 0 ? styles.resultRowFirst : null,
                index === rows.length - 1 ? styles.resultRowLast : null,
              ]}
            >
              <Text style={styles.resultTitle}>
                {ranking ? (
                  <Text style={styles.ranking}>{ranking} </Text>
                ) : null}
                {title}
              </Text>
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
  container: {
    ...listScreenStyles.container,
    backgroundColor: "#eef2f6",
  },
  list: {
    ...listScreenStyles.list,
    backgroundColor: "transparent",
  },
  listContent: {
    ...listScreenStyles.listContent,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  resultRow: {
    ...listScreenStyles.row,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#d7dee8",
    borderRightColor: "#d7dee8",
    backgroundColor: "#fff",
    paddingTop: 13,
    paddingBottom: 12,
  },
  resultRowFirst: {
    borderTopWidth: 1,
    borderTopColor: "#d7dee8",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  resultRowLast: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  resultTitle: {
    ...listScreenStyles.name,
  },
  ranking: {
    color: "#7a8798",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  stateCard: {
    ...listScreenStyles.stateCard,
    marginHorizontal: 0,
    marginTop: 12,
  },
});
