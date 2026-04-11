import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import CompetitionListItem, { type CompetitionListItemProps } from '@/components/CompetitionListItem';
import { Text } from '@/components/Themed';

const registeredCompetitions: CompetitionListItemProps[] = [
  {
    city: 'Praha 4',
    dateDay: '15',
    dateMonth: 'ZAR',
    title: 'Velka cena MZ Dance Team - Supertanecni liga 2024 - Memorial Aloise Dvoraka',
    primaryLine: 'Adult Standard 15:15',
    secondaryLine: 'Adult Latin 13:30',
  },
  {
    city: 'Kromeriz',
    dateDay: '28',
    dateMonth: 'ZAR',
    title: 'Tanecni festival TK Gradace 2024 - Tanecni liga junioru, mladeze a dospelych',
    primaryLine: 'Adult Standard 18:00',
    secondaryLine: 'Adult Latin 16:30',
  },
  {
    city: 'Liberec',
    dateDay: '12',
    dateMonth: 'RIJ',
    title: 'Podjestedsky pohar - 54. rocnik, memorial manzelu Kosekovych',
    primaryLine: 'Adult Standard 13:45',
    secondaryLine: 'Adult Latin 16:15',
  },
  {
    city: 'Mlada Boleslav',
    dateDay: '28',
    dateMonth: 'RIJ',
    title: 'Pojizersky pohar - Cena TK RYTMUS Bakov nad Jizerou - COOL DANCE 2024',
    primaryLine: 'Adult Standard 19:10',
    secondaryLine: 'Adult Latin 11:30',
  },
];

const resultCompetitions: CompetitionListItemProps[] = [
  {
    city: 'Brno',
    dateDay: '02',
    dateMonth: 'UNO',
    title: 'Moravia Open 2024 - Winter Series',
    primaryLine: 'Adult Standard 2. misto',
    secondaryLine: 'Adult Latin semifinale',
  },
  {
    city: 'Olomouc',
    dateDay: '17',
    dateMonth: 'UNO',
    title: 'Hanak Cup 2024',
    primaryLine: 'Adult Standard 4. misto',
    secondaryLine: 'Adult Latin 6. misto',
  },
  {
    city: 'Plzen',
    dateDay: '09',
    dateMonth: 'BRE',
    title: 'West Bohemia Trophy 2024',
    primaryLine: 'Adult Standard ctvrtfinale',
    secondaryLine: 'Adult Latin 3. misto',
  },
];

export default function CompetitionsScreen() {
  const [activeTab, setActiveTab] = useState<'registered' | 'results'>('registered');
  const data = activeTab === 'registered' ? registeredCompetitions : resultCompetitions;

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={data}
      keyExtractor={(item) => `${item.dateMonth}-${item.dateDay}-${item.title}`}
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <View style={styles.segmentedControlShell}>
          <View style={styles.segmentedControl}>
            <Pressable
              onPress={() => {
                setActiveTab('registered');
              }}
              style={[styles.segment, activeTab === 'registered' ? styles.segmentActive : null]}
            >
              <MaterialCommunityIcons
                color={activeTab === 'registered' ? '#2f67ce' : '#c6ccd7'}
                name="medal-outline"
                size={17}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'registered' ? styles.segmentTextActive : null,
                ]}
              >
                Prihlasene
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setActiveTab('results');
              }}
              style={[styles.segment, activeTab === 'results' ? styles.segmentActive : null]}
            >
              <MaterialCommunityIcons
                color={activeTab === 'results' ? '#c0c6d1' : '#d4d9e2'}
                name="trophy-outline"
                size={17}
              />
              <Text
                style={[styles.segmentText, activeTab === 'results' ? styles.segmentTextActive : null]}
              >
                Vysledky
              </Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => <CompetitionListItem {...item} />}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#eef2f7',
  },
  listContent: {
    paddingBottom: 28,
  },
  segmentedControlShell: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8f0',
    paddingHorizontal: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  segmentActive: {
    borderBottomColor: '#2f67ce',
  },
  segmentText: {
    color: '#c5ccd8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  segmentTextActive: {
    color: '#2f67ce',
  },
});
