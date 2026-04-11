import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";

export type CompetitionListItemDetail = {
  label: string;
  value?: string;
};

export type CompetitionListItemProps = {
  city: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  details: CompetitionListItemDetail[];
  title: string;
  variant?: "registered" | "results";
};

export default function CompetitionListItem({
  city,
  dateDay,
  dateMonth,
  dateYear,
  details,
  title,
  variant = "registered",
}: CompetitionListItemProps) {
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
