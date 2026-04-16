import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import BrandBanner from "@/components/BrandBanner";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { getDateMs } from "@/lib/cdsf";
import {
  formatCompetitionLabel,
  formatCompetitionPlacement,
} from "@/lib/competition-format";
import { competitionRegistrationsQueryOptions } from "@/lib/competition-registrations-query";
import {
  competitionResultsQueryOptions,
  flattenResults,
} from "@/lib/competition-results-sync";
import { stripMarkdown } from "@/lib/markdown";
import {
  defaultPreferences,
  notificationPreferencesStateAtom,
} from "@/lib/notification-preferences";
import {
  announcementsQueryOptions,
  getNotificationPreview,
} from "@/lib/notification-sync";
import { currentSessionAtom } from "@/lib/session";
import {
  getAnnouncementCreatedMs,
  markResultsSeenAtom,
  syncAnnouncementsAtom,
} from "@/lib/seen-state";

type FeedItem = {
  href: Href;
  id: string;
  source: "announcement" | "competition-registration" | "competition-result";
  subtitle?: string;
  timestamp: number;
  title: string;
};

const sourceStyles = {
  announcement: {
    accent: "#2457b3",
    label: "Aktuality",
  },
  "competition-registration": {
    accent: "#2b7a63",
    label: "Přihlášky",
  },
  "competition-result": {
    accent: "#b36a1e",
    label: "Výsledky",
  },
} as const;

type SummaryCardProps = {
  accent: string;
  body: string;
  label: string;
  meta: string;
  onPress: () => void;
  title: string;
};

function compareFeedItems(left: FeedItem, right: FeedItem) {
  return (
    right.timestamp - left.timestamp ||
    left.title.localeCompare(right.title, "cs") ||
    left.id.localeCompare(right.id)
  );
}

function formatTimelineDate(timestamp: number) {
  if (!Number.isFinite(timestamp)) {
    return "Bez data";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Bez data";
  }

  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}

function getResultTimestamp(event: {
  competitions: { completedAt?: string }[];
  date: string;
}) {
  const latestCompletedAt = event.competitions.reduce<string | undefined>(
    (latest, competition) => {
      if (!competition.completedAt) {
        return latest;
      }

      if (!latest || getDateMs(competition.completedAt) > getDateMs(latest)) {
        return competition.completedAt;
      }

      return latest;
    },
    undefined,
  );

  return latestCompletedAt ? getDateMs(latestCompletedAt) : getDateMs(event.date);
}

function SummaryCard({
  accent,
  body,
  label,
  meta,
  onPress,
  title,
}: SummaryCardProps) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        pressed ? styles.summaryCardPressed : null,
      ]}
    >
      <View style={[styles.summaryAccent, { backgroundColor: accent }]} />
      <Text style={[styles.summaryLabel, { color: accent }]}>{label}</Text>
      <Text numberOfLines={2} style={styles.summaryTitle}>
        {title}
      </Text>
      <Text numberOfLines={3} style={styles.summaryBody}>
        {body}
      </Text>
      <Text numberOfLines={1} style={styles.summaryMeta}>
        {meta}
      </Text>
    </Pressable>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const token = useAtomValue(currentSessionAtom)?.token;
  const preferencesState = useAtomValue(notificationPreferencesStateAtom);
  const syncAnnouncements = useSetAtom(syncAnnouncementsAtom);
  const markResultsSeen = useSetAtom(markResultsSeenAtom);
  const preferencesLoading = preferencesState === undefined;
  const preferences = preferencesState ?? defaultPreferences;
  const announcementsQuery = useInfiniteQuery({
    ...announcementsQueryOptions(token),
    enabled: !!token,
  });
  const registrationsQuery = useInfiniteQuery({
    ...competitionRegistrationsQueryOptions(token),
    enabled: !!token,
  });
  const resultsQuery = useInfiniteQuery({
    ...competitionResultsQueryOptions(token),
    enabled: !!token,
  });
  const fetchAnnouncementsNextPage = announcementsQuery.fetchNextPage;
  const fetchRegistrationsNextPage = registrationsQuery.fetchNextPage;
  const fetchResultsNextPage = resultsQuery.fetchNextPage;

  const notifications = (announcementsQuery.data?.pages ?? []).flatMap(
    (page) => page.collection || [],
  );
  const visibleNotifications = notifications.filter(
    (notification) =>
      notification.overrideMuting || preferences[notification.type],
  );
  const hiddenAnnouncementCount =
    notifications.length - visibleNotifications.length;
  const announcementsLoadingState =
    announcementsQuery.isLoading ||
    preferencesLoading ||
    (announcementsQuery.isFetchingNextPage && visibleNotifications.length === 0);
  const shouldFetchMoreAnnouncements =
    !announcementsLoadingState &&
    !announcementsQuery.isError &&
    !!announcementsQuery.hasNextPage &&
    notifications.length > 0 &&
    visibleNotifications.length === 0;
  const announcementItems = visibleNotifications
    .map(
      (notification): FeedItem => ({
        href: "/announcements",
        id: `announcement:${notification.id}`,
        source: "announcement",
        subtitle: getNotificationPreview(notification),
        timestamp: getAnnouncementCreatedMs(notification),
        title: stripMarkdown(notification.caption),
      }),
    )
    .sort(compareFeedItems);

  const registrationsStart = new Date();
  registrationsStart.setHours(0, 0, 0, 0);
  registrationsStart.setDate(registrationsStart.getDate() - 1);
  const registrationsStartMs = registrationsStart.getTime();
  const allRegistrationEvents = (registrationsQuery.data?.pages ?? []).flatMap(
    (page) => page.collection || [],
  );
  const newestRegistrationMs = allRegistrationEvents.reduce(
    (latestMs, event) => Math.max(latestMs, getDateMs(event.date)),
    Number.NEGATIVE_INFINITY,
  );
  const isSeekingCurrentRegistrations =
    !!registrationsQuery.hasNextPage &&
    !registrationsQuery.isLoading &&
    !registrationsQuery.isFetchingNextPage &&
    !registrationsQuery.isError &&
    newestRegistrationMs < registrationsStartMs;
  const hasReachedCurrentWindow =
    newestRegistrationMs >= registrationsStartMs ||
    !registrationsQuery.hasNextPage;
  const registrationEvents = allRegistrationEvents
    .filter((event) => getDateMs(event.date) >= registrationsStartMs)
    .sort((left, right) => {
      const timestampDifference = getDateMs(left.date) - getDateMs(right.date);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return left.eventName.localeCompare(right.eventName, "cs");
    });
  const registrationItems = registrationEvents
    .map((event): FeedItem => {
      const [firstCompetition] = event.competitions;
      const subtitle = firstCompetition
        ? event.competitions.length > 1
          ? `${formatCompetitionLabel(firstCompetition)} · +${event.competitions.length - 1} další`
          : formatCompetitionLabel(firstCompetition)
        : undefined;
      const eventId = typeof event.eventId === "number" ? event.eventId : undefined;

      return {
        href: eventId
          ? {
              pathname: "/competitions/events/[eventId]",
              params: { eventId },
            }
          : "/competitions/registered",
        id: `competition-registration:${eventId ?? `${event.eventName}:${event.date}`}`,
        source: "competition-registration",
        subtitle,
        timestamp: getDateMs(event.date),
        title: event.eventName,
      };
    })
    .sort(compareFeedItems);
  let nextRegistrationItem: FeedItem | undefined;
  const [nextRegistration] = registrationEvents;

  if (nextRegistration) {
    const [firstCompetition] = nextRegistration.competitions;
    const eventId =
      typeof nextRegistration.eventId === "number"
        ? nextRegistration.eventId
        : undefined;

    nextRegistrationItem = {
      href: eventId
        ? {
            pathname: "/competitions/events/[eventId]",
            params: { eventId },
          }
        : "/competitions/registered",
      id: `competition-registration:${eventId ?? `${nextRegistration.eventName}:${nextRegistration.date}`}`,
      source: "competition-registration",
      subtitle: firstCompetition
        ? nextRegistration.competitions.length > 1
          ? `${formatCompetitionLabel(firstCompetition)} · +${nextRegistration.competitions.length - 1} další`
          : formatCompetitionLabel(firstCompetition)
        : undefined,
      timestamp: getDateMs(nextRegistration.date),
      title: nextRegistration.eventName,
    };
  }

  const resultEvents = [
    ...(resultsQuery.data?.pages ?? []).flatMap((page) => page.collection || []),
  ].sort((left, right) => {
    const timestampDifference = getDateMs(right.date) - getDateMs(left.date);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return left.eventName.localeCompare(right.eventName, "cs");
  });
  const seenResultIds = flattenResults(resultEvents).map(({ id }) => id);
  const resultItems = resultEvents
    .map((event): FeedItem => {
      const [firstCompetition] = event.competitions;
      const placement = firstCompetition
        ? formatCompetitionPlacement(
            firstCompetition.ranking,
            firstCompetition.rankingTo,
            firstCompetition.competitorsCount,
          )
        : undefined;
      const summary = firstCompetition
        ? [formatCompetitionLabel(firstCompetition), placement]
            .filter(Boolean)
            .join(" · ")
        : undefined;
      const eventId = typeof event.eventId === "number" ? event.eventId : undefined;

      return {
        href: eventId
          ? {
              pathname: "/competitions/events/[eventId]",
              params: { eventId },
            }
          : "/competitions/results",
        id: `competition-result:${eventId ?? `${event.eventName}:${event.date}`}`,
        source: "competition-result",
        subtitle: summary
          ? event.competitions.length > 1
            ? `${summary} · +${event.competitions.length - 1} další`
            : summary
          : undefined,
        timestamp: getResultTimestamp(event),
        title: event.eventName,
      };
    })
    .sort(compareFeedItems);

  const timelineItems = [
    ...announcementItems,
    ...registrationItems,
    ...resultItems,
  ].sort(compareFeedItems);
  const latestAnnouncement = announcementItems[0];
  const latestResult = resultItems[0];
  const announcementsLoading =
    announcementsLoadingState && announcementItems.length === 0;
  const registrationsLoading =
    registrationEvents.length === 0 &&
    (registrationsQuery.isLoading || !hasReachedCurrentWindow);
  const resultsLoading = resultsQuery.isLoading && resultItems.length === 0;
  const isLoadingFeed =
    timelineItems.length === 0 &&
    (announcementsLoading || registrationsLoading || resultsLoading);
  const hasSourceError =
    announcementsQuery.isError ||
    registrationsQuery.isError ||
    resultsQuery.isError;
  const isRefreshing =
    !isLoadingFeed &&
    (announcementsQuery.isRefetching ||
      registrationsQuery.isRefetching ||
      resultsQuery.isRefetching);
  const isFetchingNextPage =
    announcementsQuery.isFetchingNextPage ||
    registrationsQuery.isFetchingNextPage ||
    resultsQuery.isFetchingNextPage;
  const canFetchNextPage =
    !!announcementsQuery.hasNextPage ||
    !!registrationsQuery.hasNextPage ||
    !!resultsQuery.hasNextPage;

  useEffect(() => {
    if (!shouldFetchMoreAnnouncements) {
      return;
    }

    void fetchAnnouncementsNextPage();
  }, [fetchAnnouncementsNextPage, shouldFetchMoreAnnouncements]);

  useEffect(() => {
    if (!isSeekingCurrentRegistrations) {
      return;
    }

    void fetchRegistrationsNextPage();
  }, [fetchRegistrationsNextPage, isSeekingCurrentRegistrations]);

  useEffect(() => {
    if (announcementsLoadingState || announcementsQuery.isError) {
      return;
    }

    void syncAnnouncements(notifications);
  }, [
    announcementsLoadingState,
    announcementsQuery.isError,
    notifications,
    syncAnnouncements,
  ]);

  useEffect(() => {
    if (resultsQuery.isLoading || resultsQuery.isError || seenResultIds.length === 0) {
      return;
    }

    void markResultsSeen(seenResultIds);
  }, [markResultsSeen, resultsQuery.isError, resultsQuery.isLoading, seenResultIds]);

  function refresh() {
    void Promise.all([
      announcementsQuery.refetch(),
      registrationsQuery.refetch(),
      resultsQuery.refetch(),
    ]);
  }

  function fetchMore() {
    if (announcementsQuery.hasNextPage && !announcementsQuery.isFetchingNextPage) {
      void fetchAnnouncementsNextPage();
    }

    if (registrationsQuery.hasNextPage && !registrationsQuery.isFetchingNextPage) {
      void fetchRegistrationsNextPage();
    }

    if (resultsQuery.hasNextPage && !resultsQuery.isFetchingNextPage) {
      void fetchResultsNextPage();
    }
  }

  const emptyState = isLoadingFeed
    ? {
        body: "Připravuji souhrn aktualit, přihlášek a výsledků.",
        isLoading: true,
        title: "Načítám přehled",
      }
    : hasSourceError
      ? {
          body: "Část přehledu se nepodařilo načíst. Zkuste načtení zopakovat.",
          onRetry: refresh,
          title: "Nepodařilo se načíst přehled",
        }
      : {
          body: "Jakmile se objeví nové aktuality, přihlášky nebo výsledky, uvidíte je tady.",
          title: "Zatím tu nic není",
        };

  const summaryCards = [
    latestAnnouncement
      ? {
          accent: sourceStyles.announcement.accent,
          body: latestAnnouncement.subtitle ?? "Otevřít seznam aktualit.",
          label: sourceStyles.announcement.label,
          meta: [
            formatTimelineDate(latestAnnouncement.timestamp),
            `Zobrazeno ${announcementItems.length}`,
            hiddenAnnouncementCount > 0
              ? `Skryto ${hiddenAnnouncementCount}`
              : undefined,
          ]
            .filter(Boolean)
            .join(" · "),
          onPress: () => {
            router.push("/announcements");
          },
          title: latestAnnouncement.title,
        }
      : announcementsLoading
        ? {
            accent: sourceStyles.announcement.accent,
            body: "Připravuji poslední oznámení.",
            label: sourceStyles.announcement.label,
            meta: "Načítání",
            onPress: () => {
              router.push("/announcements");
            },
            title: "Načítám aktuality",
          }
        : announcementsQuery.isError
          ? {
              accent: sourceStyles.announcement.accent,
              body: "Otevřete seznam aktualit a zkuste načtení zopakovat.",
              label: sourceStyles.announcement.label,
              meta: "Chyba načtení",
              onPress: () => {
                router.push("/announcements");
              },
              title: "Aktuality nejsou k dispozici",
            }
          : {
              accent: sourceStyles.announcement.accent,
              body: "Nová sdělení se zobrazí tady.",
              label: sourceStyles.announcement.label,
              meta:
                hiddenAnnouncementCount > 0
                  ? `Skryto ${hiddenAnnouncementCount}`
                  : "Bez novinek",
              onPress: () => {
                router.push("/announcements");
              },
              title: "Žádné aktuality",
            },
    nextRegistrationItem
      ? {
          accent: sourceStyles["competition-registration"].accent,
          body:
            nextRegistrationItem.subtitle ?? "Otevřít přehled mých přihlášek.",
          label: sourceStyles["competition-registration"].label,
          meta: [
            formatTimelineDate(nextRegistrationItem.timestamp),
            `Zobrazeno ${registrationEvents.length}`,
          ].join(" · "),
          onPress: () => {
            router.push("/competitions/registered");
          },
          title: nextRegistrationItem.title,
        }
      : registrationsLoading
        ? {
            accent: sourceStyles["competition-registration"].accent,
            body: isSeekingCurrentRegistrations
              ? "Vyhledávám aktuální soutěže."
              : "Připravuji přehled přihlášek.",
            label: sourceStyles["competition-registration"].label,
            meta: "Načítání",
            onPress: () => {
              router.push("/competitions/registered");
            },
            title: "Načítám přihlášky",
          }
        : registrationsQuery.isError
          ? {
              accent: sourceStyles["competition-registration"].accent,
              body: "Otevřete seznam přihlášek a zkuste načtení zopakovat.",
              label: sourceStyles["competition-registration"].label,
              meta: "Chyba načtení",
              onPress: () => {
                router.push("/competitions/registered");
              },
              title: "Přihlášky nejsou k dispozici",
            }
          : {
              accent: sourceStyles["competition-registration"].accent,
              body: "Aktuální přihlášky se zobrazí tady.",
              label: sourceStyles["competition-registration"].label,
              meta: "Bez přihlášek",
              onPress: () => {
                router.push("/competitions/registered");
              },
              title: "Žádné přihlášky",
            },
    latestResult
      ? {
          accent: sourceStyles["competition-result"].accent,
          body: latestResult.subtitle ?? "Otevřít přehled výsledků.",
          label: sourceStyles["competition-result"].label,
          meta: [
            formatTimelineDate(latestResult.timestamp),
            `Zobrazeno ${resultEvents.length}`,
          ].join(" · "),
          onPress: () => {
            router.push("/competitions/results");
          },
          title: latestResult.title,
        }
      : resultsLoading
        ? {
            accent: sourceStyles["competition-result"].accent,
            body: "Připravuji nejnovější výsledky soutěží.",
            label: sourceStyles["competition-result"].label,
            meta: "Načítání",
            onPress: () => {
              router.push("/competitions/results");
            },
            title: "Načítám výsledky",
          }
        : resultsQuery.isError
          ? {
              accent: sourceStyles["competition-result"].accent,
              body: "Otevřete seznam výsledků a zkuste načtení zopakovat.",
              label: sourceStyles["competition-result"].label,
              meta: "Chyba načtení",
              onPress: () => {
                router.push("/competitions/results");
              },
              title: "Výsledky nejsou k dispozici",
            }
          : {
              accent: sourceStyles["competition-result"].accent,
              body: "Nové výsledky soutěží se zobrazí tady.",
              label: sourceStyles["competition-result"].label,
              meta: "Bez výsledků",
              onPress: () => {
                router.push("/competitions/results");
              },
              title: "Žádné výsledky",
            },
  ];

  return (
    <View style={styles.container}>
      <ListTopShadow />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={timelineItems}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <ScreenStateCard
            body={emptyState.body}
            isLoading={emptyState.isLoading}
            onRetry={emptyState.onRetry}
            style={styles.stateCard}
            title={emptyState.title}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color="#2f67ce" />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <BrandBanner
              style={styles.banner}
              subtitle="Souhrn novinek, přihlášek a výsledků"
            />
            <Text style={styles.sectionTitle}>Rychlé přehledy</Text>
            <View style={styles.summaryList}>
              {summaryCards.map((card) => (
                <SummaryCard key={card.label} {...card} />
              ))}
            </View>
            <View style={styles.timelineHeader}>
              <Text style={styles.sectionTitle}>Poslední dění</Text>
              <Text style={styles.sectionBody}>
                Aktuality, přihlášky a výsledky na jednom místě.
              </Text>
            </View>
          </View>
        }
        onEndReached={canFetchNextPage ? fetchMore : undefined}
        onEndReachedThreshold={0.5}
        onRefresh={refresh}
        refreshing={isRefreshing}
        renderItem={({ item }) => {
          const source = sourceStyles[item.source];

          return (
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                router.push(item.href);
              }}
              style={({ pressed }) => [
                styles.timelineCard,
                pressed ? styles.timelineCardPressed : null,
              ]}
            >
              <View
                style={[
                  styles.timelineAccent,
                  { backgroundColor: source.accent },
                ]}
              />
              <View style={styles.timelineCopy}>
                <View style={styles.timelineMetaRow}>
                  <Text
                    style={[styles.timelineSource, { color: source.accent }]}
                  >
                    {source.label}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {formatTimelineDate(item.timestamp)}
                  </Text>
                </View>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
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
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  banner: {
    minHeight: 132,
  },
  sectionTitle: {
    color: "#182334",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginTop: 14,
  },
  sectionBody: {
    color: "#667487",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  summaryList: {
    gap: 10,
    marginTop: 10,
  },
  summaryCard: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 13,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 1,
  },
  summaryCardPressed: {
    opacity: 0.92,
  },
  summaryAccent: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  summaryTitle: {
    color: "#182334",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 21,
    marginTop: 7,
  },
  summaryBody: {
    color: "#5f6d7f",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  summaryMeta: {
    color: "#7b8797",
    fontSize: 11.5,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 10,
  },
  timelineHeader: {
    paddingBottom: 4,
  },
  timelineCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#15243f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 1,
  },
  timelineCardPressed: {
    opacity: 0.92,
  },
  timelineAccent: {
    width: 4,
    borderRadius: 999,
  },
  timelineCopy: {
    flex: 1,
  },
  timelineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  timelineSource: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  timelineDate: {
    color: "#7c8796",
    fontSize: 11.5,
    fontWeight: "700",
  },
  timelineTitle: {
    color: "#182334",
    fontSize: 15.5,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: 7,
  },
  timelineSubtitle: {
    color: "#5e6b7c",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  stateCard: {
    marginHorizontal: 12,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 16,
  },
});
