import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import type { components } from '@/CDSF';
import Ean8Barcode from '@/components/Ean8Barcode';
import { formatSimpleDate, formatTranslatedAge } from '@/lib/cdsf-formatters';

import { Text } from './Themed';

type Athlete = components['schemas']['Athlete'];

type ProfileAthleteCardProps = {
  athlete: Athlete;
};

export default function ProfileAthleteCard({ athlete }: ProfileAthleteCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Text style={styles.name}>{athlete.name}</Text>
          <Text style={styles.subline}>IDT {athlete.idt}</Text>
        </View>
        <View style={styles.agePill}>
          <Text style={styles.agePillText}>{formatTranslatedAge(athlete.age)}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons color="#6c7687" name="medical-bag" size={18} />
        <Text style={styles.metaText}>
          Zdravotni prohlidka do {formatSimpleDate(athlete.medicalCheckupExpiration) ?? 'neuvedeno'}
        </Text>
      </View>

      <View style={styles.barcodeCard}>
        <Text style={styles.barcodeTitle}>Clensky kod</Text>
        <Ean8Barcode value={athlete.idt} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 18,
    shadowColor: '#b8c2d1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  identity: {
    flex: 1,
  },
  name: {
    color: '#273142',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  subline: {
    color: '#7d8797',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  agePill: {
    borderRadius: 999,
    backgroundColor: '#edf3ff',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  agePillText: {
    color: '#2f67ce',
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  metaText: {
    color: '#525c6b',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  barcodeCard: {
    borderRadius: 18,
    backgroundColor: '#f4f7fb',
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  barcodeTitle: {
    color: '#657083',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 14,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
