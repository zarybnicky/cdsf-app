import { useEffect } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import AnnouncementCard, {
  announcementFromNotification,
} from "@/components/AnnouncementCard";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { isPagingProps, openapiClient } from "@/lib/cdsf-client";
import { filterNotifications } from "@/lib/notification-preferences";
import { useNotificationPreferences } from "@/lib/notification-preferences-provider";
import { pageSize, queryInit, seenNs } from "@/lib/notification-sync";
import { useSession } from "@/lib/session";
import { addSeenIds } from "@/lib/seen-state";

export default function AnnouncementsScreen() {
  const { authHeaders, session } = useSession();
  const { isLoading: arePreferencesLoading, preferences } =
    useNotificationPreferences();

  const query = openapiClient.useInfiniteQuery(
    "get",
    "/notifications",
    queryInit(authHeaders, pageSize),
    {
      enabled: !!authHeaders,
      ...isPagingProps,
    },
  );
  const { fetchNextPage, hasNextPage, isError, isFetchingNextPage, isLoading } =
    query;
  const isRefreshing = query.isRefetching && !isLoading;

  const notifications = (query.data?.pages ?? []).flatMap(
    (page) => page.collection || [],
  );
  const visible = filterNotifications(notifications, preferences);
  const visibleIds = visible.map((notification) => notification.id.toString());
  const hiddenCount = notifications.length - visible.length;
  const isLoadingState =
    isLoading ||
    arePreferencesLoading ||
    (isFetchingNextPage && visible.length === 0);
  const announcements = isLoadingState
    ? []
    : visible.map(announcementFromNotification);
  const showFilterNotice = hiddenCount > 0 && !isLoadingState && !isError;
  const emptyStateTitle = isLoadingState
    ? "Načítám aktuality"
    : isError
      ? "Nepodařilo se načíst aktuality"
      : hiddenCount > 0
        ? "Podle zvoleného filtru zde nejsou žádné aktuality"
        : "Zatím nejsou dostupné žádné aktuality";
  const emptyStateBody = isLoadingState
    ? "Aktuality se načítají."
    : isError
      ? "Zkuste načtení zopakovat."
      : hiddenCount > 0
        ? "V nastavení aktualit můžete upravit filtry a zobrazit další sdělení."
        : "Jakmile budou zveřejněny nové informace, zobrazí se zde.";

  useEffect(() => {
    if (
      isLoadingState ||
      isError ||
      !hasNextPage ||
      notifications.length === 0 ||
      visible.length > 0
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
    visible.length,
  ]);

  useEffect(() => {
    if (isLoadingState || isError || visibleIds.length === 0) {
      return;
    }

    void addSeenIds(seenNs, visibleIds, session?.email);
  }, [isError, isLoadingState, session?.email, visibleIds]);

  function refresh() {
    void query.refetch();
  }

  return (
    <View style={styles.container}>
      <ListTopShadow />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={announcements}
        keyExtractor={(item) => item.id ?? `${item.title}-${item.publishedAt}`}
        ListHeaderComponent={
          showFilterNotice ? (
            <View style={styles.header}>
              <View style={styles.filterNotice}>
                <Text style={styles.filterNoticeTitle}>
                  Skryté položky: {hiddenCount}
                </Text>
                <Text style={styles.filterNoticeBody}>
                  Důležitá oznámení se zobrazují vždy.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )
        }
        ListEmptyComponent={
          <ScreenStateCard
            body={emptyStateBody}
            isLoading={isLoadingState}
            onRetry={isError ? refresh : undefined}
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
        onRefresh={refresh}
        onEndReached={hasNextPage ? () => void fetchNextPage() : undefined}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => <AnnouncementCard {...item} />}
        refreshing={isRefreshing}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  headerSpacer: {
    height: 6,
  },
  filterNotice: {
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
