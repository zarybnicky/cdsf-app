import { StyleSheet, View } from "react-native";

import type { components } from "@/CDSF";
import Ean8Barcode from "@/components/Ean8Barcode";
import { formatSimpleDate, formatTranslatedAge } from "@/lib/cdsf-formatters";

import { Text } from "./Themed";

type Athlete = components["schemas"]["Athlete"];

type ProfileAthleteCardProps = {
  athlete: Athlete;
};

export default function ProfileAthleteCard({
  athlete,
}: ProfileAthleteCardProps) {
  const translatedAge = formatTranslatedAge(athlete.age);
  const medicalCheckupExpiration =
    formatSimpleDate(athlete.medicalCheckupExpiration) ?? "Není uvedena";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{athlete.name}</Text>
        <Text style={styles.subline}>IDT {athlete.idt}</Text>
      </View>

      <View style={styles.details}>
        <View style={[styles.detailRow, styles.detailRowBorder]}>
          <Text style={styles.detailLabel}>Kategorie</Text>
          <Text style={styles.detailValue}>{translatedAge}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Platnost lékařské prohlídky</Text>
          <Text style={styles.detailValue}>{medicalCheckupExpiration}</Text>
        </View>
      </View>

      <View style={styles.barcodeCard}>
        <Text style={styles.barcodeTitle}>Členský kód</Text>
        <Ean8Barcode value={athlete.idt} />
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
    backgroundColor: "#f7f9fc",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  barcodeTitle: {
    color: "#6b7485",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginBottom: 12,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
