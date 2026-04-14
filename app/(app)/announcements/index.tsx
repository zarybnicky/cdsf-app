import { useEffect } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useAtomValue, useSetAtom } from "jotai";

import AnnouncementCard, {
  announcementFromNotification,
} from "@/components/AnnouncementCard";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import {
  defaultPreferences,
  notificationPreferencesStateAtom,
} from "@/lib/notification-preferences";
import { announcementsAtom } from "@/lib/notification-sync";
import { syncAnnouncementsAtom } from "@/lib/seen-state";

export default function AnnouncementsScreen() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useAtomValue(announcementsAtom);
  const preferencesState = useAtomValue(notificationPreferencesStateAtom);
  const syncAnnouncements = useSetAtom(syncAnnouncementsAtom);
  const prefsLoading = preferencesState.state === "loading";
  const preferences =
    preferencesState.state === "hasData"
      ? preferencesState.data
      : defaultPreferences;
  const isRefreshing = isRefetching && !isLoading;
  const notifications = (data?.pages ?? []).flatMap(
    (page) => page.collection || [],
  );
  const visible = notifications.filter(
    (notification) =>
      notification.overrideMuting || preferences[notification.type],
  );
  const hiddenCount = notifications.length - visible.length;
  const isLoadingState =
    isLoading ||
    prefsLoading ||
    (isFetchingNextPage && visible.length === 0);
  const announcements = isLoadingState
    ? []
    : visible.map(announcementFromNotification);
  const showFilterNotice = hiddenCount > 0 && !isLoadingState && !isError;
  let emptyStateTitle = "Zatím nejsou dostupné žádné aktuality";
  let emptyStateBody = "Jakmile budou zveřejněny nové informace, zobrazí se zde.";

  if (isLoadingState) {
    emptyStateTitle = "Načítám aktuality";
    emptyStateBody = "Aktuality se načítají.";
  } else if (isError) {
    emptyStateTitle = "Nepodařilo se načíst aktuality";
    emptyStateBody = "Zkuste načtení zopakovat.";
  } else if (hiddenCount > 0) {
    emptyStateTitle = "Podle zvoleného filtru zde nejsou žádné aktuality";
    emptyStateBody =
      "V nastavení aktualit můžete upravit filtry a zobrazit další sdělení.";
  }

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
    isLoadingState,
    notifications.length,
    visible.length,
  ]);

  useEffect(() => {
    if (isLoadingState || isError) {
      return;
    }

    void syncAnnouncements(notifications);
  }, [isError, isLoadingState, notifications, syncAnnouncements]);

  function refresh() {
    void refetch();
  }

  return (
    <View style={styles.container}>
      <ListTopShadow />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={announcements}
        keyExtractor={(item) => item.id}
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
