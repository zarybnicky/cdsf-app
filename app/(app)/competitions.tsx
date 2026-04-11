import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import CompetitionListItem, { type CompetitionListItemProps } from '@/components/CompetitionListItem';
import { Text } from '@/components/Themed';
import { openapiClient, isPagingProps } from '@/lib/cdsf-client';
import { eventRegistrationToCompetitionCard } from '@/lib/cdsf-formatters';
import { useSession } from '@/lib/session';

export default function CompetitionsScreen() {
  const [activeTab, setActiveTab] = useState<'registered' | 'results'>('registered');
  const { authHeaders } = useSession();

  const registrationsQuery = openapiClient.useInfiniteQuery(
    'get',
    '/athletes/current/competitions/registrations',
    {
      headers: authHeaders,
      params: {
        query: {
          pageSize: 5,
        },
      },
    },
    {
      enabled: !!authHeaders && activeTab === 'registered',
      ...isPagingProps,
    },
  );

  const resultsQuery = openapiClient.useInfiniteQuery(
    'get',
    '/athletes/current/competitions/results',
    {
      headers: authHeaders,
      params: {
        query: {
          pageSize: 5,
        },
      },
    },
    {
      enabled: !!authHeaders && activeTab === 'results',
      ...isPagingProps,
    },
  );

  const currentQuery = activeTab === 'registered' ? registrationsQuery : resultsQuery;
  const data: CompetitionListItemProps[] =
    currentQuery.data?.pages.flatMap((page) =>
      (page?.collection || []).map((item) => eventRegistrationToCompetitionCard(item, activeTab)),
    ) || [];
  const detailIconName = activeTab === 'registered' ? 'account-plus-outline' : 'trophy-outline';

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={data}
      keyExtractor={(item) => `${item.dateMonth}-${item.dateDay}-${item.title}-${item.city}`}
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
      ListEmptyComponent={
        <View style={styles.stateCard}>
          {currentQuery.isLoading ? <ActivityIndicator color="#2f67ce" /> : null}
          <Text style={styles.stateTitle}>
            {currentQuery.isLoading
              ? 'Nacitam souteze'
              : currentQuery.isError
                ? 'Nepodarilo se nacist souteze'
                : activeTab === 'registered'
                  ? 'Zadne prihlasky'
                  : 'Zadne vysledky'}
          </Text>
          <Text style={styles.stateBody}>
            {currentQuery.isLoading
              ? 'Data z CDSF API se nacitaji do teto zalozky.'
              : currentQuery.isError
                ? 'Zkuste nacitani zopakovat.'
                : activeTab === 'registered'
                  ? 'Jakmile budou dostupne registrace, objevi se v tomto seznamu.'
                  : 'Jakmile budou dostupne vysledky, objevi se v tomto seznamu.'}
          </Text>
          {currentQuery.isError ? (
            <Pressable
              onPress={() => {
                void currentQuery.refetch();
              }}
              style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : null]}
            >
              <Text style={styles.retryButtonText}>Zkusit znovu</Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListFooterComponent={
        currentQuery.isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color="#2f67ce" />
          </View>
        ) : null
      }
      onEndReached={currentQuery.hasNextPage ? () => void currentQuery.fetchNextPage() : undefined}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => (
        <CompetitionListItem {...item} detailIconName={detailIconName} />
      )}
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
  stateCard: {
    marginHorizontal: 14,
    marginTop: 16,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stateTitle: {
    color: '#394150',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  stateBody: {
    color: '#778091',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#2f67ce',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryButtonPressed: {
    opacity: 0.9,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: 20,
  },
});
