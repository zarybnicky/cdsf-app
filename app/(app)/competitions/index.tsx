import { useEffect, useRef, useState } from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { components } from "@/CDSF";
import CompetitionListItem from "@/components/CompetitionListItem";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { openapiClient, isPagingProps } from "@/lib/cdsf-client";
import { getDateMs } from "@/lib/cdsf";
import { useSession } from "@/lib/session";

type CompetitionTab = "registered" | "results";
type CompetitionEvent = components["schemas"]["EventRegistration"];
type CompetitionTabDefinition = {
  label: string;
  emptyTitle: string;
  emptyBody: string;
};

const competitionTabs: Record<CompetitionTab, CompetitionTabDefinition> = {
  registered: {
    label: "Přihlášky",
    emptyTitle: "Žádné přihlášky na soutěže",
    emptyBody: "Jakmile budou přihlášky na soutěže evidovány, zobrazí se zde.",
  },
  results: {
    label: "Výsledky",
    emptyTitle: "Žádné výsledky soutěží",
    emptyBody: "Jakmile budou zveřejněny výsledky soutěží, zobrazí se zde.",
  },
};
const competitionTabOrder: CompetitionTab[] = ["registered", "results"];
const competitionPageSize = 100;

function getRequestedCompetitionTab(
  value: string | string[] | undefined,
): CompetitionTab | undefined {
  const normalizedValue = Array.isArray(value) ? value[0] : value;

  if (normalizedValue === "registered" || normalizedValue === "results") {
    return normalizedValue;
  }

  return undefined;
}

function sortCompetitionEvents(events: CompetitionEvent[]) {
  return [...events].sort((left, right) => {
    const timestampDifference = getDateMs(right.date) - getDateMs(left.date);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return left.eventName.localeCompare(right.eventName, "cs");
  });
}

function sortCompetitionEventsAscending(events: CompetitionEvent[]) {
  return [...events].sort((left, right) => {
    const timestampDifference = getDateMs(left.date) - getDateMs(right.date);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return left.eventName.localeCompare(right.eventName, "cs");
  });
}

function getRegistrationsStartTimestamp() {
  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  return yesterday.getTime();
}

type CompetitionTabButtonProps = {
  activeTab: CompetitionTab;
  tab: CompetitionTab;
  onPress: (tab: CompetitionTab) => void;
};

function CompetitionTabButton({
  activeTab,
  tab,
  onPress,
}: CompetitionTabButtonProps) {
  const isActive = activeTab === tab;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      hitSlop={4}
      onPress={() => {
        onPress(tab);
      }}
      style={({ pressed }) => [
        styles.segment,
        isActive ? styles.segmentActive : null,
        pressed ? styles.segmentPressed : null,
      ]}
    >
      <Text
        style={[styles.segmentText, isActive ? styles.segmentTextActive : null]}
      >
        {competitionTabs[tab].label}
      </Text>
    </Pressable>
  );
}

export default function CompetitionsScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string | string[] }>();
  const requestedTab = getRequestedCompetitionTab(tab);
  const handledRequestedTabRef = useRef<CompetitionTab | null>(null);
  const [activeTab, setActiveTab] = useState<CompetitionTab>(
    () => requestedTab ?? "registered",
  );
  const { authHeaders } = useSession();

  const registrationsQuery = openapiClient.useInfiniteQuery(
    "get",
    "/athletes/current/competitions/registrations",
    {
      headers: authHeaders,
      params: {
        query: {
          pageSize: competitionPageSize,
        },
      },
    },
    {
      enabled: !!authHeaders && activeTab === "registered",
      ...isPagingProps,
    },
  );

  const resultsQuery = openapiClient.useInfiniteQuery(
    "get",
    "/athletes/current/competitions/results",
    {
      headers: authHeaders,
      params: {
        query: {
          pageSize: competitionPageSize,
        },
      },
    },
    {
      enabled: !!authHeaders && activeTab === "results",
      ...isPagingProps,
    },
  );

  const currentTab = competitionTabs[activeTab];
  const currentQuery =
    activeTab === "registered" ? registrationsQuery : resultsQuery;
  const isRefreshing = currentQuery.isRefetching && !currentQuery.isLoading;
  const registrationsStartTimestamp = getRegistrationsStartTimestamp();
  const allEvents =
    currentQuery.data?.pages.flatMap((page) => page?.collection || []) || [];
  const newestFetchedEventTimestamp = allEvents.reduce(
    (newestTimestamp, event) =>
      Math.max(newestTimestamp, getDateMs(event.date)),
    Number.NEGATIVE_INFINITY,
  );
  const isSeekingCurrentRegistrations =
    activeTab === "registered" &&
    !!currentQuery.hasNextPage &&
    !currentQuery.isLoading &&
    !currentQuery.isFetchingNextPage &&
    !currentQuery.isError &&
    newestFetchedEventTimestamp < registrationsStartTimestamp;
  const hasReachedRegistrationsWindow =
    activeTab !== "registered" ||
    newestFetchedEventTimestamp >= registrationsStartTimestamp ||
    !currentQuery.hasNextPage;
  const isLoadingState =
    currentQuery.isLoading ||
    (activeTab === "registered" && !hasReachedRegistrationsWindow);
  const visibleEvents =
    activeTab === "registered"
      ? sortCompetitionEventsAscending(
          allEvents.filter(
            (event) => getDateMs(event.date) >= registrationsStartTimestamp,
          ),
        )
      : sortCompetitionEvents(allEvents);
  const emptyStateTitle = isLoadingState
    ? activeTab === "registered" && isSeekingCurrentRegistrations
      ? "Načítám aktuální přihlášky"
      : "Načítám přehled soutěží"
    : currentQuery.isError
      ? "Nepodařilo se načíst přehled soutěží"
      : currentTab.emptyTitle;
  const emptyStateBody = isLoadingState
    ? activeTab === "registered" && isSeekingCurrentRegistrations
      ? "Vyhledávám nejnovější přihlášky."
      : "Přehled soutěží se načítá."
    : currentQuery.isError
      ? "Zkuste načtení zopakovat."
      : currentTab.emptyBody;

  useEffect(() => {
    if (!requestedTab) {
      handledRequestedTabRef.current = null;
      return;
    }

    if (handledRequestedTabRef.current === requestedTab) {
      return;
    }

    handledRequestedTabRef.current = requestedTab;

    if (requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, requestedTab]);

  useEffect(() => {
    if (
      activeTab !== "registered" ||
      !currentQuery.hasNextPage ||
      currentQuery.isLoading ||
      currentQuery.isFetchingNextPage ||
      currentQuery.isError
    ) {
      return;
    }

    void currentQuery.fetchNextPage();
  }, [activeTab, currentQuery]);

  function refreshCurrentTab() {
    void currentQuery.refetch();
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Soutěže",
          headerRight: () => (
            <View accessibilityRole="tablist" style={styles.headerToggle}>
              {competitionTabOrder.map((tab) => (
                <CompetitionTabButton
                  key={tab}
                  activeTab={activeTab}
                  onPress={setActiveTab}
                  tab={tab}
                />
              ))}
            </View>
          ),
        }}
      />

      <View style={styles.listArea}>
        <ListTopShadow />
        <FlatList
          contentContainerStyle={styles.listContent}
          data={visibleEvents}
          keyExtractor={(item) =>
            item.eventId?.toString() ?? `${item.eventName}-${item.date}`
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <ScreenStateCard
              body={emptyStateBody}
              isLoading={isLoadingState}
              onRetry={currentQuery.isError ? refreshCurrentTab : undefined}
              style={styles.stateCard}
              title={emptyStateTitle}
            />
          }
          ListFooterComponent={
            currentQuery.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color="#2f67ce" />
              </View>
            ) : null
          }
          onRefresh={refreshCurrentTab}
          onEndReached={
            currentQuery.hasNextPage
              ? () => void currentQuery.fetchNextPage()
              : undefined
          }
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <CompetitionListItem event={item} variant={activeTab} />
          )}
          refreshing={isRefreshing}
          style={styles.list}
        />
      </View>
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
    minHeight: 0,
  },
  listArea: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerToggle: {
    flexDirection: "row",
    gap: 3,
    marginRight: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe6ef",
    backgroundColor: "#eef3f8",
    padding: 3,
  },
  segment: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dce4ef",
    shadowColor: "#183769",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentPressed: {
    opacity: 0.86,
  },
  segmentText: {
    color: "#7e8997",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  segmentTextActive: {
    color: "#2457b3",
  },
  stateCard: {
    marginHorizontal: 12,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 16,
  },
});
