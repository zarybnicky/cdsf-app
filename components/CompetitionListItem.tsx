import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";

export type CompetitionListItemProps = {
  city: string;
  dateDay: string;
  dateMonth: string;
  details: string[];
  detailIconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
};

export default function CompetitionListItem({
  city,
  dateDay,
  dateMonth,
  details,
  detailIconName = "account-plus-outline",
  title,
}: CompetitionListItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.dateBadge}>
        <View style={styles.monthBadge}>
          <Text style={styles.monthText}>{dateMonth}</Text>
        </View>
        <View style={styles.dayBadge}>
          <Text style={styles.dayText}>{dateDay}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.city}>{city}</Text>
        <Text style={styles.title}>{title}</Text>

        {details.map((detail, index) => (
          <View key={`${title}-${detail}-${index}`} style={styles.metaRow}>
            <View style={styles.detailIconShell}>
              <MaterialCommunityIcons
                color="#2457b3"
                name={detailIconName}
                size={14}
              />
            </View>
            <Text style={styles.metaText}>{detail}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  dateBadge: {
    width: 48,
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
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  dayBadge: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#d4dae6",
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  dayText: {
    color: "#11181c",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
  },
  content: {
    flex: 1,
    gap: 6,
  },
  city: {
    color: "#2457b3",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  title: {
    color: "#182334",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  detailIconShell: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "#eef4ff",
    marginTop: 1,
  },
  metaText: {
    color: "#4f5c6f",
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
  },
});
