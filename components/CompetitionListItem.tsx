import type { components } from "@/CDSF";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import { getAgeLabel, parseCdsfDate } from "@/lib/cdsf";

type EventRegistration = components["schemas"]["EventRegistration"];
type CompetitionRegistration = components["schemas"]["CompetitionRegistration"];
type RuntimeCompetitionRegistration = CompetitionRegistration & {
  competitorsCount?: number;
  fromClass?: CompetitionRegistration["class"];
};

export type CompetitionListItemDetail = {
  label: string;
  value?: string;
};

type CompetitionListItemData = {
  city: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  details: CompetitionListItemDetail[];
  title: string;
};

export type CompetitionListItemProps = {
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

function formatClass(competition: RuntimeCompetitionRegistration) {
  const classLabel = competition.class;

  if (
    !classLabel ||
    classLabel === "Open" ||
    classLabel === ("Unknown" as CompetitionRegistration["class"])
  ) {
    return undefined;
  }

  return classLabel;
}

function formatGrade(grade?: CompetitionRegistration["grade"]) {
  switch (grade) {
    case "Championship":
      return "MČR";
    case "League":
      return "TL";
    case "SuperLeague":
      return "STL";
    default:
      return undefined;
  }
}

function formatDiscipline(
  discipline: CompetitionRegistration["discipline"],
) {
  switch (discipline) {
    case "Standard":
      return "STT";
    case "Latin":
      return "LAT";
    case "TenDances":
      return "10T";
    case "Standard+Latin":
      return "STT + LAT";
    case "SingleOfTenDances":
      return "Single 10T";
    case "FreeStyle":
      return "Freestyle";
    default:
      return discipline;
  }
}

function formatPlacement(
  ranking?: number,
  rankingTo?: number,
  competitorsCount?: number,
) {
  if (typeof ranking !== "number") {
    return undefined;
  }

  const rankingLabel =
    typeof rankingTo === "number" && rankingTo > ranking
      ? `${ranking}-${rankingTo}`
      : `${ranking}`;

  if (typeof competitorsCount === "number" && competitorsCount > 0) {
    return `${rankingLabel}\u2009/\u2009${competitorsCount}`;
  }

  if (typeof rankingTo === "number" && rankingTo > ranking) {
    return `${ranking}.-${rankingTo}.`;
  }

  return `${ranking}.`;
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
  function getItemData(): CompetitionListItemData {
    const details = event.competitions.map((competition) => {
      const runtimeCompetition = competition as RuntimeCompetitionRegistration;
      const label = [
        formatGrade(competition.grade),
        getAgeLabel(competition.age),
        formatClass(runtimeCompetition),
        formatDiscipline(competition.discipline),
      ]
        .filter(Boolean)
        .join(" ");

      if (variant === "results") {
        const value = formatPlacement(
          competition.ranking,
          competition.rankingTo,
          runtimeCompetition.competitorsCount,
        );

        if (value) {
          return { label, value };
        }
      }

      return { label };
    });

    return {
      city: event.city,
      title: event.eventName,
      details,
      ...getDateBadge(event.date),
    };
  }

  const { city, dateDay, dateMonth, dateYear, details, title } = getItemData(
  );

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
        <Text style={styles.city}>{city}</Text>
        <Text style={styles.title}>{title}</Text>

        {details.map((detail, index) => (
          <View
            key={`${title}-${detail.label}-${detail.value ?? "detail"}-${index}`}
            style={
              variant === "results"
                ? styles.resultsMetaRow
                : styles.registrationMetaRow
            }
          >
            {variant === "results" ? (
              <View style={styles.resultsMetaCopy}>
                <View style={styles.resultsMetaLabelWrap}>
                  <Text style={styles.resultsMetaLabel}>{detail.label}</Text>
                </View>
                {detail.value ? (
                  <Text style={styles.resultsMetaValue}>{detail.value}</Text>
                ) : null}
              </View>
            ) : (
              <>
                <View style={styles.metaMarker} />
                <Text style={styles.registrationMetaText}>
                  {detail.label}
                  {detail.value ? (
                    <>
                      <Text style={styles.metaSeparator}> · </Text>
                      <Text style={styles.registrationMetaValue}>
                        {detail.value}
                      </Text>
                    </>
                  ) : null}
                </Text>
              </>
            )}
          </View>
        ))}
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
  metaSeparator: {
    color: "#8a95a5",
  },
  registrationMetaValue: {
    color: "#315ea8",
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 17,
  },
  resultsMetaRow: {
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
});
