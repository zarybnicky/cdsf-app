import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import CompetitionListItem, {
  type CompetitionListItemProps,
} from "@/components/CompetitionListItem";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { openapiClient, isPagingProps } from "@/lib/cdsf-client";
import { eventRegistrationToCompetitionCard } from "@/lib/cdsf-formatters";
import { useSession } from "@/lib/session";

type CompetitionTab = "registered" | "results";
type CompetitionTabDefinition = {
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  activeIconColor: string;
  inactiveIconColor: string;
  detailIconName: keyof typeof MaterialCommunityIcons.glyphMap;
  emptyTitle: string;
  emptyBody: string;
};

const competitionTabs: Record<CompetitionTab, CompetitionTabDefinition> = {
  registered: {
    label: "Přihlášky",
    iconName: "medal-outline",
    activeIconColor: "#2f67ce",
    inactiveIconColor: "#c6ccd7",
    detailIconName: "account-plus-outline",
    emptyTitle: "Žádné přihlášky na soutěže",
    emptyBody:
      "Jakmile budou přihlášky na soutěže evidovány, zobrazí se zde.",
  },
  results: {
    label: "Výsledky",
    iconName: "trophy-outline",
    activeIconColor: "#c0c6d1",
    inactiveIconColor: "#d4d9e2",
    detailIconName: "trophy-outline",
    emptyTitle: "Žádné výsledky soutěží",
    emptyBody: "Jakmile budou zveřejněny výsledky soutěží, zobrazí se zde.",
  },
};
const competitionTabOrder: CompetitionTab[] = ["registered", "results"];

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
  const config = competitionTabs[tab];
  const isActive = activeTab === tab;

  return (
    <Pressable
      onPress={() => {
        onPress(tab);
      }}
      style={[styles.segment, isActive ? styles.segmentActive : null]}
    >
      <MaterialCommunityIcons
        color={isActive ? config.activeIconColor : config.inactiveIconColor}
        name={config.iconName}
        size={17}
      />
      <Text
        style={[styles.segmentText, isActive ? styles.segmentTextActive : null]}
      >
        {config.label}
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
          pageSize: 5,
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
          pageSize: 5,
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
  const data: CompetitionListItemProps[] =
    currentQuery.data?.pages.flatMap((page) =>
      (page?.collection || []).map((item) =>
        eventRegistrationToCompetitionCard(item, activeTab),
      ),
    ) || [];
  const emptyStateTitle = currentQuery.isLoading
    ? "Načítám přehled soutěží"
    : currentQuery.isError
      ? "Nepodařilo se načíst přehled soutěží"
      : currentTab.emptyTitle;
  const emptyStateBody = currentQuery.isLoading
    ? "Přehled soutěží se načítá."
    : currentQuery.isError
      ? "Zkuste načtení zopakovat."
      : currentTab.emptyBody;

  function handleRetry() {
    void currentQuery.refetch();
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={data}
      keyExtractor={(item) =>
        `${item.dateMonth}-${item.dateDay}-${item.title}-${item.city}`
      }
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
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
      }
      ListEmptyComponent={
        <ScreenStateCard
          body={emptyStateBody}
          isLoading={currentQuery.isLoading}
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
        <CompetitionListItem
          {...item}
          detailIconName={currentTab.detailIconName}
        />
      )}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#eef2f7",
  },
  listContent: {
    paddingBottom: 28,
  },
  segmentedControlShell: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e8f0",
    paddingHorizontal: 4,
  },
  segmentedControl: {
    flexDirection: "row",
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  segmentActive: {
    borderBottomColor: "#2f67ce",
  },
  segmentText: {
    color: "#c5ccd8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  segmentTextActive: {
    color: "#2f67ce",
  },
  stateCard: {
    marginHorizontal: 14,
    marginTop: 16,
  },
  footer: {
    paddingVertical: 20,
  },
});
