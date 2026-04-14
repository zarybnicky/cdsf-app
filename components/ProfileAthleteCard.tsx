import { StyleSheet, View } from "react-native";

import type { components } from "@/CDSF";
import Ean8Barcode from "@/components/Ean8Barcode";
import { formatSimpleDate, getAgeLabel } from "@/lib/cdsf";

import { Text } from "./Themed";

type Athlete = components["schemas"]["Athlete"];

type ProfileAthleteCardProps = {
  athlete: Athlete;
};

export default function ProfileAthleteCard({
  athlete,
}: ProfileAthleteCardProps) {
  const details = [
    ["Kategorie", getAgeLabel(athlete.age)],
    [
      "Platnost lékařské prohlídky",
      formatSimpleDate(athlete.medicalCheckupExpiration) ?? "Není uvedena",
    ],
  ] as const;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{athlete.name}</Text>
        <Text style={styles.subline}>IDT {athlete.idt}</Text>
      </View>

      <View style={styles.details}>
        {details.map(([label, value], index) => (
          <View
            key={label}
            style={[
              styles.detailRow,
              index < details.length - 1 ? styles.detailRowBorder : null,
            ]}
          >
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.barcodeCard}>
        <Text style={styles.barcodeTitle}>Členský kód</Text>
        <View style={styles.barcodePanel}>
          <Ean8Barcode value={athlete.idt} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    marginBottom: 12,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  name: {
    color: "#182334",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  subline: {
    color: "#2457b3",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 5,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: "#eef2f6",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f6",
  },
  detailLabel: {
    color: "#2457b3",
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#223045",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "right",
  },
  barcodeCard: {
    borderTopWidth: 1,
    borderTopColor: "#eef2f6",
    alignItems: "center",
    backgroundColor: "#f7f9fc",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  barcodePanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  barcodeTitle: {
    color: "#6b7485",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginBottom: 10,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
