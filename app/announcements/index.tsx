import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useAtomValue, useSetAtom } from "jotai";

import AnnouncementCard, {
  announcementFromNotification,
} from "@/components/AnnouncementCard";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import {
  notificationsAtom,
  seenNotificationsAtom,
  syncStateAtom,
} from "@/lib/atoms";
import {
  isNotificationVisible,
  notificationPreferencesAtom,
} from "@/lib/notification-preferences";
import { sync } from "@/lib/sync";

export default function AnnouncementsScreen() {
  const storedNotifications = useAtomValue(notificationsAtom);
  const syncState = useAtomValue(syncStateAtom).notifications;
  const preferences = useAtomValue(notificationPreferencesAtom);
  const markSeen = useSetAtom(seenNotificationsAtom);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notifications = Object.values(storedNotifications).sort(
    (left, right) =>
      right.created.localeCompare(left.created) || right.id - left.id,
  );
  const visibleNotifications = notifications.filter(
    (notification) => isNotificationVisible(notification, preferences),
  );
  const hiddenCount = notifications.length - visibleNotifications.length;
  const isLoadingState =
    notifications.length === 0 &&
    syncState.lastSync === null &&
    syncState.lastError === null;
  const showFilterNotice =
    hiddenCount > 0 && !isLoadingState && !syncState.lastError;
  const announcements = isLoadingState
    ? []
    : visibleNotifications.map(announcementFromNotification);
  let emptyStateTitle = "Zatím nejsou dostupné žádné aktuality";
  let emptyStateBody =
    "Jakmile budou zveřejněny nové informace, zobrazí se zde.";

  if (isLoadingState) {
    emptyStateTitle = "Načítám aktuality";
    emptyStateBody = "Aktuality se načítají.";
  } else if (syncState.lastError) {
    emptyStateTitle = "Nepodařilo se načíst aktuality";
    emptyStateBody = "Zkuste načtení zopakovat.";
  } else if (hiddenCount > 0) {
    emptyStateTitle = "Podle zvoleného filtru zde nejsou žádné aktuality";
    emptyStateBody =
      "V nastavení aktualit můžete upravit filtry a zobrazit další sdělení.";
  }

  useEffect(() => {
    const ids = Object.values(storedNotifications)
      .filter((notification) =>
        isNotificationVisible(notification, preferences),
      )
      .map((notification) => String(notification.id));
    if (ids.length === 0) return;

    markSeen((seen) => {
      if (ids.every((id) => id in seen)) return seen;
      const next = { ...seen };
      const seenAt = Date.now();
      for (const id of ids) {
        if (!(id in next)) next[id] = seenAt;
      }
      return next;
    });
  }, [markSeen, preferences, storedNotifications]);

  async function refresh() {
    setIsRefreshing(true);
    try {
      await sync({ trigger: "manual", domains: ["notifications"] }).catch(
        () => {},
      );
    } finally {
      setIsRefreshing(false);
    }
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
            onRetry={syncState.lastError ? () => void refresh() : undefined}
            style={styles.stateCard}
            title={emptyStateTitle}
          />
        }
        onRefresh={() => void refresh()}
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
});
