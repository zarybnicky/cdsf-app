import { StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";

type CompetitionDetailRowProps = {
  label: string;
  value?: string | null;
};

export function CompetitionDetailRow({
  label,
  value,
}: CompetitionDetailRowProps) {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value.trim()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailRow: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f6",
  },
  detailLabel: {
    color: "#728093",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#223045",
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 4,
  },
});
