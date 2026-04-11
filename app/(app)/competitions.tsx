import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type { components } from "@/CDSF";
import CompetitionListItem, {
  type CompetitionListItemProps,
} from "@/components/CompetitionListItem";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { openapiClient, isPagingProps } from "@/lib/cdsf-client";
import { getCdsfTimestamp } from "@/lib/cdsf-dates";
import { eventRegistrationToCompetitionCard } from "@/lib/cdsf-formatters";
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

function getCompetitionTimestamp(event: CompetitionEvent) {
  return getCdsfTimestamp(event.date);
}

function sortCompetitionEvents(events: CompetitionEvent[]) {
  return [...events].sort((left, right) => {
    const timestampDifference =
      getCompetitionTimestamp(right) - getCompetitionTimestamp(left);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return left.eventName.localeCompare(right.eventName, "cs");
  });
}

function sortCompetitionEventsAscending(events: CompetitionEvent[]) {
  return [...events].sort((left, right) => {
    const timestampDifference =
      getCompetitionTimestamp(left) - getCompetitionTimestamp(right);

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
  const [activeTab, setActiveTab] = useState<CompetitionTab>("registered");
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
  const registrationsStartTimestamp = getRegistrationsStartTimestamp();
  const allEvents =
    currentQuery.data?.pages.flatMap((page) => page?.collection || []) || [];
  const newestFetchedEventTimestamp = allEvents.reduce(
    (newestTimestamp, event) =>
      Math.max(newestTimestamp, getCompetitionTimestamp(event)),
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
            (event) => getCompetitionTimestamp(event) >= registrationsStartTimestamp,
          ),
        )
      : sortCompetitionEvents(allEvents);
  const data: CompetitionListItemProps[] = visibleEvents.map((item) =>
    eventRegistrationToCompetitionCard(item, activeTab),
  );
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

  function handleRetry() {
    void currentQuery.refetch();
  }

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControlShell}>
        <View style={styles.segmentedControl}>
          {competitionTabOrder.map((tab) => (
            <CompetitionTabButton
              key={tab}
              activeTab={activeTab}
              onPress={setActiveTab}
              tab={tab}
            />
          ))}
        </View>
      </View>

      <View style={styles.listArea}>
        <ListTopShadow />
        <FlatList
          contentContainerStyle={styles.listContent}
          data={data}
          keyExtractor={(item) =>
            `${item.dateYear}-${item.dateMonth}-${item.dateDay}-${item.title}-${item.city}`
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <ScreenStateCard
              body={emptyStateBody}
              isLoading={isLoadingState}
              onRetry={currentQuery.isError ? handleRetry : undefined}
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
          onEndReached={
            currentQuery.hasNextPage
              ? () => void currentQuery.fetchNextPage()
              : undefined
          }
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <CompetitionListItem {...item} variant={activeTab} />
          )}
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
  segmentedControlShell: {
    zIndex: 1,
    backgroundColor: "#f4f6f8",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  segmentedControl: {
    flexDirection: "row",
    gap: 6,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
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
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.15,
    textTransform: "uppercase",
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
