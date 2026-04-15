import type { components } from "@/CDSF";
import { Stack, useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import CompetitionListItem from "@/components/CompetitionListItem";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { competitionTabs, type CompetitionTab } from "@/lib/competition-routes";

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

const tabs: CompetitionTab[] = ["registered", "results"];

function HeaderTabs({ tab: active }: Pick<Props, "tab">) {
  const router = useRouter();

  return (
    <View accessibilityRole="tablist" style={styles.headerToggle}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        const { href, label } = competitionTabs[tab];

        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            hitSlop={4}
            onPress={() => {
              if (!isActive) {
                router.replace(href);
              }
            }}
            style={({ pressed }) => [
              styles.segment,
              isActive ? styles.segmentActive : null,
              pressed ? styles.segmentPressed : null,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                isActive ? styles.segmentTextActive : null,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
          headerRight: () => <HeaderTabs tab={tab} />,
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
