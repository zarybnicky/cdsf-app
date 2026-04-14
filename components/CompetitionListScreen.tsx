import type { components } from "@/CDSF";
import { Stack } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import CompetitionHeaderTabs from "@/components/CompetitionHeaderTabs";
import CompetitionListItem from "@/components/CompetitionListItem";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { type CompetitionTab } from "@/lib/competition-routes";

type Props = {
  events: components["schemas"]["EventRegistration"][];
  isFetchingNextPage: boolean;
  isRefreshing: boolean;
  onEndReached?: () => void;
  onPressCompetition?: (competitionId: number, eventId: number) => void;
  onPressEvent?: (eventId: number) => void;
  onRefresh: () => void;
  stateCard: {
    body: string;
    isLoading?: boolean;
    onRetry?: () => void;
    title: string;
  };
  tab: CompetitionTab;
};

export default function CompetitionListScreen({
  events,
  isFetchingNextPage,
  isRefreshing,
  onEndReached,
  onPressCompetition,
  onPressEvent,
  onRefresh,
  stateCard,
  tab,
}: Props) {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => <CompetitionHeaderTabs active={tab} />,
          title: "Soutěže",
        }}
      />

      <ListTopShadow />
      <FlatList
        contentContainerStyle={styles.listContent}
        data={events}
        keyExtractor={(item) =>
          item.eventId?.toString() ?? `${item.eventName}-${item.date}`
        }
        ListEmptyComponent={
          <ScreenStateCard
            body={stateCard.body}
            isLoading={stateCard.isLoading}
            onRetry={stateCard.onRetry}
            style={styles.stateCard}
            title={stateCard.title}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color="#2f67ce" />
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        renderItem={({ item }) => {
          const eventId = item.eventId ?? 0;

          return (
            <CompetitionListItem
              event={item}
              onPressCompetition={
                onPressCompetition
                  ? (competitionId) => {
                      onPressCompetition(competitionId, eventId);
                    }
                  : undefined
              }
              onPressEvent={
                onPressEvent && eventId > 0
                  ? () => {
                      onPressEvent(eventId);
                    }
                  : undefined
              }
              variant={tab}
            />
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
    minHeight: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  stateCard: {
    marginHorizontal: 12,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 16,
  },
});
