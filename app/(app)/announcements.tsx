import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import AnnouncementCard, { type AnnouncementCardProps } from '@/components/AnnouncementCard';
import { Text } from '@/components/Themed';
import { openapiClient, isPagingProps } from '@/lib/cdsf-client';
import { notificationToAnnouncementCard } from '@/lib/cdsf-formatters';
import { useSession } from '@/lib/session';

export default function AnnouncementsScreen() {
  const { authHeaders } = useSession();

  const query = openapiClient.useInfiniteQuery(
    'get',
    '/notifications',
    {
      headers: authHeaders,
      params: {
        query: {
          pageSize: 10,
        },
      },
    },
    {
      enabled: !!authHeaders,
      ...isPagingProps,
    },
  );

  const announcements: AnnouncementCardProps[] =
    query.data?.pages.flatMap((page) =>
      (page?.collection || []).map(notificationToAnnouncementCard),
    ) || [];

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={announcements}
      keyExtractor={(item) => item.id ?? `${item.title}-${item.publishedAt}`}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.kicker}>Aktuality</Text>
          <Text style={styles.subtitle}>
            Informacni servis klubu s dulezitymi oznameni, zmenami a administrativnimi udalostmi.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.stateCard}>
          {query.isLoading ? <ActivityIndicator color="#2f67ce" /> : null}
          <Text style={styles.stateTitle}>
            {query.isLoading
              ? 'Nacitam aktuality'
              : query.isError
                ? 'Nepodarilo se nacist aktuality'
                : 'Zatim tu nejsou zadne aktuality'}
          </Text>
          <Text style={styles.stateBody}>
            {query.isLoading
              ? 'Data z CDSF API se nacitaji do teto obrazovky.'
              : query.isError
                ? 'Zkuste nacitani zopakovat.'
                : 'Jakmile budou v systemu dostupne, objevi se tady.'}
          </Text>
          {query.isError ? (
            <Pressable
              onPress={() => {
                void query.refetch();
              }}
              style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : null]}
            >
              <Text style={styles.retryButtonText}>Zkusit znovu</Text>
            </Pressable>
          ) : null}
        </View>
      }
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color="#2f67ce" />
          </View>
        ) : null
      }
      onEndReached={query.hasNextPage ? () => void query.fetchNextPage() : undefined}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => <AnnouncementCard {...item} />}
      showsVerticalScrollIndicator={false}
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
    paddingTop: 14,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 10,
    paddingHorizontal: 18,
  },
  kicker: {
    color: '#394150',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#778091',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  stateCard: {
    marginHorizontal: 14,
    marginTop: 8,
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
