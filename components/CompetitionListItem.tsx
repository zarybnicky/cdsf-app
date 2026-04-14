import type { components } from "@/CDSF";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import {
  formatCompetitionLabel,
  formatCompetitionPlacement,
} from "@/lib/competition-format";
import { parseCdsfDate } from "@/lib/cdsf";

type EventRegistration = components["schemas"]["EventRegistration"];
type Competition = EventRegistration["competitions"][number];

export type CompetitionListItemProps = {
  event: EventRegistration;
  onPressCompetition?: (competitionId: number) => void;
  onPressEvent?: () => void;
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
  onPressCompetition,
  onPressEvent,
  variant = "registered",
}: CompetitionListItemProps) {
  const isResults = variant === "results";
  const competitions = event.competitions;
  const { dateDay, dateMonth, dateYear } = getDateBadge(event.date);
  const title =
    isResults && onPressEvent ? (
      <Pressable
        accessibilityRole="link"
        onPress={onPressEvent}
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

  function renderCompetition(competition: Competition) {
    const label = formatCompetitionLabel(competition);

    if (!isResults) {
      return (
        <View
          key={competition.competitionId}
          style={styles.registrationMetaRow}
        >
          <View style={styles.metaMarker} />
          <Text style={styles.registrationMetaText}>{label}</Text>
        </View>
      );
    }

    const value = formatCompetitionPlacement(
      competition.ranking,
      competition.rankingTo,
      competition.competitorsCount,
    );
    const content = (
      <View style={styles.resultsMetaCopy}>
        <View style={styles.resultsMetaLabelWrap}>
          <Text style={styles.resultsMetaLabel}>{label}</Text>
        </View>
        {value ? <Text style={styles.resultsMetaValue}>{value}</Text> : null}
      </View>
    );

    if (!onPressCompetition) {
      return (
        <View key={competition.competitionId} style={styles.resultsMetaRow}>
          {content}
        </View>
      );
    }

    return (
      <Pressable
        key={competition.competitionId}
        accessibilityRole="link"
        onPress={() => {
          onPressCompetition(competition.competitionId);
        }}
        style={({ pressed }) => [
          styles.resultsMetaRow,
          styles.resultsMetaPressable,
          pressed ? styles.linkPressed : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  const content = (
    <>
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
        {competitions.map(renderCompetition)}
      </View>
    </>
  );

  if (isResults || !onPressEvent) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPressEvent}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
    >
      {content}
    </Pressable>
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
  cardPressed: {
    opacity: 0.9,
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
  registrationMetaRow: {
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
  resultsMetaRow: {
    paddingTop: 1,
  },
  resultsMetaPressable: {
    borderRadius: 10,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    paddingVertical: 3,
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
