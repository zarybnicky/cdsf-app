import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

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
  detailIconName = 'account-plus-outline',
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
            <Text style={styles.metaText}>{detail}</Text>
            <MaterialCommunityIcons color="#6d8fc4" name={detailIconName} size={16} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6eaf2',
    paddingHorizontal: 14,
    paddingVertical: 17,
  },
  dateBadge: {
    width: 42,
    alignItems: 'stretch',
    paddingTop: 1,
  },
  monthBadge: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#1f232b',
    paddingVertical: 3,
  },
  monthText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayBadge: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#d4dae6',
    backgroundColor: '#fff',
    paddingVertical: 7,
  },
  dayText: {
    color: '#11181c',
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    gap: 7,
  },
  city: {
    color: '#8e98aa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#343b49',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 19,
  },
});
