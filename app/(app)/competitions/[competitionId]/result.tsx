import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { resultsFullAtom, resultsSummaryAtom } from "@/lib/atoms";
import {
  formatCompletion,
  formatCompetitionLabel,
  formatCompetitionPlacement,
  formatCompetitorName,
} from "@/lib/competition-format";
import { listScreenStyles } from "@/lib/competition-screen-styles";
import { withHeaderSubtitle } from "@/lib/navigation-header";
import { formatSimpleDate, formatSimpleDateTime } from "@/lib/cdsf";
import { refreshCompetitionResult } from "@/lib/competition-details";

export default function CompetitionResultScreen() {
  const params = useLocalSearchParams<{ competitionId?: string }>();
  const parsedCompetitionId = Number(params.competitionId);
  const competitionId =
    Number.isInteger(parsedCompetitionId) && parsedCompetitionId > 0
      ? parsedCompetitionId
      : null;
  const resultEvents = useAtomValue(resultsSummaryAtom);
  const result = useAtomValue(resultsFullAtom)[competitionId ?? 0];
  const event = resultEvents.find((x) =>
    x.competitions.some((c) => c.competitionId === competitionId),
  );
  const competition = event?.competitions.find(
    (x) => x.competitionId === competitionId,
  );
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    result ? "ready" : "loading",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rows = [...(result?.competitors ?? [])].sort((left, right) => {
    const leftRank = left.ranking ?? Number.MAX_SAFE_INTEGER;
    const rightRank = right.ranking ?? Number.MAX_SAFE_INTEGER;

    return leftRank - rightRank || left.startNumber - right.startNumber;
  });

  useEffect(() => {
    if (!competitionId) return;
    void refreshCompetitionResult(competitionId).then(
      () => setLoadState("ready"),
      () => setLoadState("error"),
    );
  }, [competitionId]);

  async function refresh() {
    if (!competitionId) return;
    setIsRefreshing(true);
    try {
      await refreshCompetitionResult(competitionId);
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

  const title = competition ? formatCompetitionLabel(competition) : "Výsledek";
  const loading = loadState === "loading" && !result;
  const hasError = loadState === "error" && !result;
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
        event?.date ? formatSimpleDate(event.date) : undefined,
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
        onRefresh={() => void refresh()}
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
