import { Stack, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import CompetitionListItem from "@/components/CompetitionListItem";
import ListTopShadow from "@/components/ListTopShadow";
import ScreenStateCard from "@/components/ScreenStateCard";
import {
  recentResultsAtom,
  registrationsAtom,
  syncStateAtom,
} from "@/lib/atoms";
import { getDateMs } from "@/lib/cdsf";
import { sync } from "@/lib/sync";

const tabs = [
  { key: "registered", href: "/competitions/registered", label: "Přihlášky" },
  { key: "results", href: "/competitions/results", label: "Výsledky" },
] as const;

type CompetitionTab = (typeof tabs)[number]["key"];

function HeaderTabs({ tab: active }: { tab: CompetitionTab }) {
  const router = useRouter();

  return (
    <View accessibilityRole="tablist" style={styles.headerToggle}>
      {tabs.map(({ href, key, label }) => {
        const isActive = key === active;

        return (
          <Pressable
            key={key}
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
  tab,
}: {
  tab: CompetitionTab;
}) {
  const domain = tab === "registered" ? "registrations" : "results";
  const storedEvents = useAtomValue(
    tab === "registered" ? registrationsAtom : recentResultsAtom,
  );
  const syncState = useAtomValue(syncStateAtom)[domain];
  const [isRefreshing, setIsRefreshing] = useState(false);
  const registrationsStart = new Date();
  registrationsStart.setHours(0, 0, 0, 0);
  registrationsStart.setDate(registrationsStart.getDate() - 1);
  const events =
    tab === "registered"
      ? storedEvents
          .filter(
            (event) => getDateMs(event.date) >= registrationsStart.getTime(),
          )
          .sort(
            (left, right) =>
              getDateMs(left.date) - getDateMs(right.date) ||
              left.eventName.localeCompare(right.eventName, "cs"),
          )
      : storedEvents;
  const isLoading =
    storedEvents.length === 0 &&
    syncState.lastSync === null &&
    syncState.lastError === null;
  const hasError = Boolean(syncState.lastError);
  const emptyBody =
    tab === "registered"
      ? "Jakmile budou přihlášky na soutěže evidovány, zobrazí se zde."
      : "Jakmile budou zveřejněny výsledky soutěží, zobrazí se zde.";
  const emptyTitle =
    tab === "registered"
      ? "Žádné přihlášky na soutěže"
      : "Žádné výsledky soutěží";

  async function refresh() {
    setIsRefreshing(true);
    try {
      await sync({ trigger: "manual", domains: [domain] }).catch(() => {});
    } finally {
      setIsRefreshing(false);
    }
  }

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
            body={
              isLoading
                ? "Přehled soutěží se načítá."
                : hasError
                  ? "Zkuste načtení zopakovat."
                  : emptyBody
            }
            isLoading={isLoading}
            onRetry={hasError ? () => void refresh() : undefined}
            style={styles.stateCard}
            title={
              isLoading
                ? "Načítám přehled soutěží"
                : hasError
                  ? "Nepodařilo se načíst přehled soutěží"
                  : emptyTitle
            }
          />
        }
        onRefresh={() => void refresh()}
        refreshing={isRefreshing}
        renderItem={({ item }) => (
          <CompetitionListItem event={item} variant={tab} />
        )}
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
});
