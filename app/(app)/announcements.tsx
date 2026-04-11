import { useEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import AnnouncementCard, { type AnnouncementCardProps } from '@/components/AnnouncementCard';
import { Text } from '@/components/Themed';
import { openapiClient, isPagingProps } from '@/lib/cdsf-client';
import { notificationToAnnouncementCard } from '@/lib/cdsf-formatters';
import { filterNotifications } from '@/lib/notification-preferences';
import { useNotificationPreferences } from '@/lib/notification-preferences-provider';
import {
  createNotificationsQueryInit,
  getNotificationSeenId,
  notificationsPageSize,
  notificationsSeenNamespace,
} from '@/lib/notification-sync';
import { useSession } from '@/lib/session';
import { markSeenIds } from '@/lib/seen-state';

export default function AnnouncementsScreen() {
  const { authHeaders, session } = useSession();
  const {
    isLoading: areNotificationPreferencesLoading,
    preferences: notificationPreferences,
  } = useNotificationPreferences();
  const notificationsQueryInit = createNotificationsQueryInit(authHeaders, notificationsPageSize);

  const query = openapiClient.useInfiniteQuery(
    'get',
    '/notifications',
    notificationsQueryInit,
    {
      enabled: !!authHeaders,
      ...isPagingProps,
    },
  );
  const {
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = query;

  const notifications = useMemo(
    () => query.data?.pages.flatMap((page) => page?.collection || []) || [],
    [query.data?.pages],
  );
  const visibleNotifications = useMemo(
    () => filterNotifications(notifications, notificationPreferences),
    [notificationPreferences, notifications],
  );
  const visibleNotificationIds = useMemo(
    () => visibleNotifications.map(getNotificationSeenId),
    [visibleNotifications],
  );
  const hiddenNotificationCount = notifications.length - visibleNotifications.length;
  const isLoadingState =
    isLoading ||
    areNotificationPreferencesLoading ||
    (isFetchingNextPage && visibleNotifications.length === 0);
  const announcements: AnnouncementCardProps[] =
    isLoadingState ? [] : visibleNotifications.map(notificationToAnnouncementCard);

  useEffect(() => {
    if (
      isLoadingState ||
      isError ||
      !hasNextPage ||
      notifications.length === 0 ||
      visibleNotifications.length > 0
    ) {
      return;
    }

    void fetchNextPage();
  }, [
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isLoadingState,
    notifications.length,
    visibleNotifications.length,
  ]);

  useEffect(() => {
    if (isLoadingState || isError || visibleNotificationIds.length === 0) {
      return;
    }

    void markSeenIds(notificationsSeenNamespace, visibleNotificationIds, session?.email);
  }, [isError, isLoadingState, session?.email, visibleNotificationIds]);

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
          {hiddenNotificationCount > 0 && !isLoadingState && !isError ? (
            <View style={styles.filterNotice}>
              <Text style={styles.filterNoticeTitle}>
                Skryto podle nastaveni: {hiddenNotificationCount}
              </Text>
              <Text style={styles.filterNoticeBody}>
                Prioritni oznameni se i tak zobrazi vzdy.
              </Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.stateCard}>
          {isLoadingState ? <ActivityIndicator color="#2f67ce" /> : null}
          <Text style={styles.stateTitle}>
            {isLoadingState
              ? 'Nacitam aktuality'
              : isError
                ? 'Nepodarilo se nacist aktuality'
                : hiddenNotificationCount > 0
                  ? 'Aktuality jsou skryte filtrem'
                : 'Zatim tu nejsou zadne aktuality'}
          </Text>
          <Text style={styles.stateBody}>
            {isLoadingState
              ? 'Data z CDSF API se nacitaji do teto obrazovky.'
              : isError
                ? 'Zkuste nacitani zopakovat.'
                : hiddenNotificationCount > 0
                  ? 'Upravte filtry upozorneni v nastaveni profilu a zobrazite dalsi polozky.'
                : 'Jakmile budou v systemu dostupne, objevi se tady.'}
          </Text>
          {isError ? (
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
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color="#2f67ce" />
          </View>
        ) : null
      }
      onEndReached={hasNextPage ? () => void fetchNextPage() : undefined}
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
  filterNotice: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterNoticeTitle: {
    color: '#394150',
    fontSize: 13,
    fontWeight: '700',
  },
  filterNoticeBody: {
    color: '#778091',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
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
