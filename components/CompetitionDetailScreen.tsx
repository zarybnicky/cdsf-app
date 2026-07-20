import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import CompetitionEventLink from "@/components/CompetitionEventLink";
import ScreenStateCard from "@/components/ScreenStateCard";
import {
  competitionsAtom,
  resultsFullAtom,
  resultsSummaryAtom,
  startlistsAtom,
} from "@/lib/atoms";
import {
  refreshCompetitionResult,
  refreshCompetitionStartlist,
} from "@/lib/competition-details";
import {
  formatCompletion,
  formatCompetitionLabel,
  formatCompetitionPlacement,
  formatCompetitorName,
  formatCompetitorSource,
  formatPresence,
} from "@/lib/competition-format";
import { formatSimpleDate, formatSimpleDateTime } from "@/lib/cdsf";
import { withHeaderSubtitle } from "@/lib/navigation-header";

type DetailKind = "startlist" | "result";
type DetailRow = {
  key: string;
  meta?: string;
  ranking?: string;
  title: string;
};

const detailCopy = {
  result: {
    fallbackTitle: "Výsledek",
    loadingBody: "Výsledek soutěže se načítá.",
    loadingTitle: "Načítám výsledek soutěže",
    errorTitle: "Nepodařilo se načíst výsledek soutěže",
    emptyBody: "Pro tuto soutěž zatím není k dispozici žádný výsledek.",
    emptyTitle: "Žádný výsledek soutěže",
  },
  startlist: {
    fallbackTitle: "Startovní listina",
    loadingBody: "Startovní listina soutěže se načítá.",
    loadingTitle: "Načítám startovní listinu",
    errorTitle: "Nepodařilo se načíst startovní listinu",
    emptyBody: "Pro tuto soutěž zatím nejsou k dispozici žádné položky.",
    emptyTitle: "Žádné položky ve startovní listině",
  },
} as const;

function parseId(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function CompetitionDetailScreen({
  kind,
}: {
  kind: DetailKind;
}) {
  const params = useLocalSearchParams<{
    competitionId?: string;
    eventId?: string;
  }>();
  const competitionId = parseId(params.competitionId);
  const eventId = parseId(params.eventId);
  const isResult = kind === "result";
  const copy = detailCopy[kind];
  const competitions = useAtomValue(competitionsAtom);
  const startlists = useAtomValue(startlistsAtom);
  const results = useAtomValue(resultsFullAtom);
  const resultEvents = useAtomValue(resultsSummaryAtom);
  const result = results[competitionId ?? 0];
  const startlist = startlists[competitionId ?? 0] ?? [];
  const event =
    isResult && eventId
      ? resultEvents.find((candidate) => candidate.eventId === eventId)
      : undefined;
  const competition =
    competitions[competitionId ?? 0] ??
    event?.competitions.find((item) => item.competitionId === competitionId);
  const hasCachedStartlist =
    competitionId !== null && competitionId in startlists;
  const hasCachedData = isResult ? Boolean(result) : hasCachedStartlist;
  const load = isResult
    ? refreshCompetitionResult
    : refreshCompetitionStartlist;
  const initiallyReady = isResult
    ? Boolean(result)
    : Boolean(competition && hasCachedStartlist);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    initiallyReady ? "ready" : "loading",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!competitionId) return;
    void load(competitionId).then(
      () => setLoadState("ready"),
      () => setLoadState("error"),
    );
  }, [competitionId, load]);

  async function refresh() {
    if (!competitionId) return;
    setIsRefreshing(true);
    try {
      await load(competitionId);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    } finally {
      setIsRefreshing(false);
    }
  }

  if (!competitionId) return <Redirect href="/+not-found" />;

  const rows: DetailRow[] = isResult
    ? [...(result?.competitors ?? [])]
        .sort((left, right) => {
          const leftRank = left.ranking ?? Number.MAX_SAFE_INTEGER;
          const rightRank = right.ranking ?? Number.MAX_SAFE_INTEGER;
          return leftRank - rightRank || left.startNumber - right.startNumber;
        })
        .map((item) => {
          const fallbackTitle = `Startovní číslo ${item.startNumber}`;
          const title = formatCompetitorName(item.competitor, fallbackTitle);
          const source =
            item.club ??
            item.competitor?.club ??
            item.country ??
            item.competitor?.country;
          return {
            key: item.competitorId.toString(),
            title,
            ranking: formatCompetitionPlacement(item.ranking, item.rankingTo),
            meta: [
              source,
              title === fallbackTitle
                ? undefined
                : `Start. č. ${item.startNumber}`,
              formatCompletion(item.completion?.completion),
            ]
              .filter(Boolean)
              .join(" · "),
          };
        })
    : startlist.map((item) => ({
        key: item.competitorId.toString(),
        title: formatCompetitorName(item),
        meta: [
          formatCompetitorSource(item),
          formatPresence(item.presence),
          item.startsWithRound && item.startsWithRound > 1
            ? `Od ${item.startsWithRound}. kola`
            : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
      }));
  const title = competition
    ? formatCompetitionLabel(competition)
    : copy.fallbackTitle;
  const summary = competition
    ? isResult
      ? [
          event?.date ? formatSimpleDate(event.date) : undefined,
          result?.completedAt
            ? `dokončeno ${formatSimpleDateTime(result.completedAt)}`
            : undefined,
        ]
          .filter(Boolean)
          .join(" · ")
      : [
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
  const loading = loadState === "loading" && !hasCachedData;
  const hasError = loadState === "error" && !hasCachedData;
  const stateCard = loading
    ? {
        body: copy.loadingBody,
        isLoading: true,
        title: copy.loadingTitle,
      }
    : hasError
      ? {
          body: "Zkuste načtení zopakovat.",
          onRetry: refresh,
          title: copy.errorTitle,
        }
      : {
          body: copy.emptyBody,
          title: copy.emptyTitle,
        };

  return (
    <View style={[styles.container, isResult && styles.resultContainer]}>
      <Stack.Screen options={withHeaderSubtitle(title, summary)} />
      <FlatList
        contentContainerStyle={[
          styles.listContent,
          isResult && styles.resultListContent,
        ]}
        data={rows}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          eventId ? (
            <CompetitionEventLink
              eventId={eventId}
              style={isResult ? styles.resultEventLink : styles.eventLink}
            />
          ) : null
        }
        ListEmptyComponent={
          <ScreenStateCard
            body={stateCard.body}
            isLoading={stateCard.isLoading}
            onRetry={stateCard.onRetry}
            style={[styles.stateCard, isResult && styles.resultStateCard]}
            title={stateCard.title}
          />
        }
        onRefresh={() => void refresh()}
        refreshing={isRefreshing}
        renderItem={({ item, index }) => (
          <View
            style={
              isResult
                ? [
                    styles.row,
                    styles.resultRow,
                    index === 0 && styles.resultRowFirst,
                    index === rows.length - 1 && styles.resultRowLast,
                  ]
                : styles.row
            }
          >
            <Text style={styles.name}>
              {item.ranking ? (
                <Text style={styles.ranking}>{item.ranking} </Text>
              ) : null}
              {item.title}
            </Text>
            {item.meta ? <Text style={styles.meta}>{item.meta}</Text> : null}
          </View>
        )}
        showsVerticalScrollIndicator={false}
        style={[styles.list, isResult && styles.resultList]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  list: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d7dee8",
  },
  name: {
    color: "#223045",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  meta: {
    color: "#6a7788",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  stateCard: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  eventLink: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  resultContainer: {
    backgroundColor: "#eef2f6",
  },
  resultList: {
    backgroundColor: "transparent",
  },
  resultListContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  resultEventLink: {
    marginBottom: 12,
  },
  resultRow: {
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
  ranking: {
    color: "#7a8798",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  resultStateCard: {
    marginHorizontal: 0,
  },
});
