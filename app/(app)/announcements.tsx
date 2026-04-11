import { useEffect, useMemo } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import AnnouncementCard from "@/components/AnnouncementCard";
import ScreenHeader from "@/components/ScreenHeader";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { openapiClient, isPagingProps } from "@/lib/cdsf-client";
import { notificationToAnnouncementCard } from "@/lib/cdsf-formatters";
import { filterNotifications } from "@/lib/notification-preferences";
import { useNotificationPreferences } from "@/lib/notification-preferences-provider";
import {
  createNotificationsQueryInit,
  flattenNotificationPages,
  getNotificationSeenId,
  notificationsPageSize,
  notificationsSeenNamespace,
} from "@/lib/notification-sync";
import { useSession } from "@/lib/session";
import { markSeenIds } from "@/lib/seen-state";

export default function AnnouncementsScreen() {
  const { authHeaders, session } = useSession();
  const {
    isLoading: areNotificationPreferencesLoading,
    preferences: notificationPreferences,
  } = useNotificationPreferences();
  const notificationsQueryInit = createNotificationsQueryInit(
    authHeaders,
    notificationsPageSize,
  );

  const query = openapiClient.useInfiniteQuery(
    "get",
    "/notifications",
    notificationsQueryInit,
    {
      enabled: !!authHeaders,
      ...isPagingProps,
    },
  );
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage, isLoading } =
    query;

  const notifications = useMemo(
    () => flattenNotificationPages(query.data?.pages ?? []),
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
  const hiddenNotificationCount =
    notifications.length - visibleNotifications.length;
  const isLoadingState =
    isLoading ||
    areNotificationPreferencesLoading ||
    (isFetchingNextPage && visibleNotifications.length === 0);
  const announcements = isLoadingState
    ? []
    : visibleNotifications.map(notificationToAnnouncementCard);
  const shouldShowFilterNotice =
    hiddenNotificationCount > 0 && !isLoadingState && !isError;
  const emptyStateTitle = isLoadingState
    ? "Načítám aktuality"
    : isError
      ? "Nepodařilo se načíst aktuality"
      : hiddenNotificationCount > 0
        ? "Podle zvoleného filtru zde nejsou žádné aktuality"
        : "Zatím nejsou dostupné žádné aktuality";
  const emptyStateBody = isLoadingState
    ? "Aktuality se načítají."
    : isError
      ? "Zkuste načtení zopakovat."
      : hiddenNotificationCount > 0
        ? "V nastavení profilu můžete upravit filtry a zobrazit další sdělení."
        : "Jakmile budou zveřejněny nové informace, zobrazí se zde.";

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

    void markSeenIds(
      notificationsSeenNamespace,
      visibleNotificationIds,
      session?.email,
    );
  }, [isError, isLoadingState, session?.email, visibleNotificationIds]);

  function handleRetry() {
    void query.refetch();
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={announcements}
      keyExtractor={(item) => item.id ?? `${item.title}-${item.publishedAt}`}
      ListHeaderComponent={
        <ScreenHeader
          body="Důležitá sdělení ke soutěžím, administrativě a dění ve svazu."
          bodyStyle={styles.subtitle}
          eyebrow="Informační servis"
          style={styles.header}
          title="Aktuality"
        >
          {shouldShowFilterNotice ? (
            <View style={styles.filterNotice}>
              <Text style={styles.filterNoticeTitle}>
                Skryté položky: {hiddenNotificationCount}
              </Text>
              <Text style={styles.filterNoticeBody}>
                Důležitá oznámení se zobrazují vždy.
              </Text>
            </View>
          ) : null}
        </ScreenHeader>
      }
      ListEmptyComponent={
        <ScreenStateCard
          body={emptyStateBody}
          isLoading={isLoadingState}
          onRetry={isError ? handleRetry : undefined}
          style={styles.stateCard}
          title={emptyStateTitle}
        />
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
    backgroundColor: "#f4f6f8",
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 8,
    paddingHorizontal: 14,
  },
  subtitle: {
    color: "#5b6778",
    fontSize: 14,
    lineHeight: 20,
  },
  filterNotice: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  filterNoticeTitle: {
    color: "#223045",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  filterNoticeBody: {
    color: "#617082",
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 4,
  },
  stateCard: {
    marginHorizontal: 12,
    marginTop: 6,
  },
  footer: {
    paddingVertical: 16,
  },
});
