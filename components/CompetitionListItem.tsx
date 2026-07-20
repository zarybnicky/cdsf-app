import type { components } from "@/CDSF";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  formatCompetitionLabel,
  formatCompetitionPlacement,
} from "@/lib/competition-format";
import { parseCdsfDate } from "@/lib/cdsf";
import { dismissResultNotification } from "@/lib/notify";

type EventRegistration = components["schemas"]["EventRegistration"];

type CompetitionListItemProps = {
  event: EventRegistration;
  variant?: "registered" | "results";
};

const monthLabels = [
  "LED",
  "UNO",
  "BŘE",
  "DUB",
  "KVĚ",
  "ČER",
  "ČVC",
  "SRP",
  "ZÁŘ",
  "ŘÍJ",
  "LIS",
  "PRO",
];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getDateBadge(dateString: string) {
  const date = parseCdsfDate(dateString);

  if (!date) {
    return {
      dateDay: "--",
      dateMonth: "---",
      dateYear: "----",
    };
  }

  return {
    dateDay: pad(date.getDate()),
    dateMonth: monthLabels[date.getMonth()],
    dateYear: date.getFullYear().toString(),
  };
}

export default function CompetitionListItem({
  event,
  variant = "registered",
}: CompetitionListItemProps) {
  const router = useRouter();
  const isResults = variant === "results";
  const eventId = event.eventId;
  const eventKey = eventId ?? event.date ?? event.eventName;
  const { dateDay, dateMonth, dateYear } = getDateBadge(event.date);
  const title = eventId ? (
    <Pressable
      accessibilityRole="link"
      onPress={() =>
        router.push({
          pathname: "/competitions/events/[eventId]",
          params: { eventId },
        })
      }
      style={({ pressed }) => [
        styles.titleButton,
        pressed ? styles.linkPressed : null,
      ]}
    >
      <Text style={[styles.title, styles.titleLink]}>{event.eventName}</Text>
    </Pressable>
  ) : (
    <Text style={styles.title}>{event.eventName}</Text>
  );

  function openCompetition(competitionId: number) {
    if (isResults) void dismissResultNotification(competitionId);
    router.push({
      pathname: isResults
        ? "/competitions/[competitionId]/result"
        : "/competitions/[competitionId]/startlist",
      params: eventId ? { competitionId, eventId } : { competitionId },
    });
  }

  return (
    <View style={styles.card}>
      <View style={styles.dateBadge}>
        <View style={styles.monthBadge}>
          <Text style={styles.monthText}>{dateMonth}</Text>
        </View>
        <View style={styles.dayBadge}>
          <Text style={styles.dayText}>{dateDay}</Text>
          <Text style={styles.yearText}>{dateYear}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.city}>{event.city}</Text>
        {title}
        {event.competitions.map((competition, index) => {
          const label = formatCompetitionLabel(competition);
          const placement = isResults
            ? formatCompetitionPlacement(
                competition.ranking,
                competition.rankingTo,
                competition.competitorsCount,
              )
            : undefined;

          return (
            <Pressable
              key={[eventKey, competition.competitionId, index].join(":")}
              accessibilityRole="link"
              onPress={() => openCompetition(competition.competitionId)}
              style={({ pressed }) => [
                styles.competitionRow,
                isResults ? styles.resultsRow : styles.registrationRow,
                pressed ? styles.linkPressed : null,
              ]}
            >
              {isResults ? (
                <View style={styles.resultsMetaCopy}>
                  <View style={styles.resultsMetaLabelWrap}>
                    <Text style={styles.resultsMetaLabel}>{label}</Text>
                  </View>
                  {placement ? (
                    <Text style={styles.resultsMetaValue}>{placement}</Text>
                  ) : null}
                </View>
              ) : (
                <>
                  <View style={styles.metaMarker} />
                  <Text style={styles.registrationMetaText}>{label}</Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dfe5ee",
    backgroundColor: "#fff",
    marginHorizontal: 10,
    marginTop: 8,
    paddingHorizontal: 11,
    paddingVertical: 10,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  dateBadge: {
    width: 46,
    alignItems: "stretch",
    paddingTop: 2,
  },
  monthBadge: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#171b22",
    paddingVertical: 4,
  },
  monthText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  dayBadge: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#d4dae6",
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 4,
  },
  dayText: {
    color: "#1c2735",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 19,
    textAlign: "center",
  },
  yearText: {
    color: "#8793a3",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
    lineHeight: 10,
    marginTop: 2,
    textAlign: "center",
  },
  content: {
    flex: 1,
    gap: 5,
  },
  city: {
    color: "#2457b3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.45,
    textTransform: "uppercase",
  },
  title: {
    color: "#223045",
    fontSize: 15.5,
    fontWeight: "700",
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  titleButton: {
    alignSelf: "flex-start",
    borderRadius: 10,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  titleLink: {
    color: "#2457b3",
  },
  competitionRow: {
    borderRadius: 10,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  registrationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaMarker: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#c3ccda",
    marginLeft: 2,
  },
  registrationMetaText: {
    color: "#5b6778",
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
  },
  resultsRow: {
    paddingTop: 1,
  },
  resultsMetaCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
  },
  resultsMetaLabelWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  resultsMetaLabel: {
    color: "#5b6778",
    fontSize: 12.5,
    lineHeight: 17,
  },
  resultsMetaValue: {
    color: "#315ea8",
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 17,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  linkPressed: {
    opacity: 0.7,
  },
});
