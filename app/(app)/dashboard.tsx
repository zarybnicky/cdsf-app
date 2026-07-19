import { SymbolView } from "expo-symbols";
import { Tabs, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useCallback, useState, type ReactNode } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import CompetitionListItem from "@/components/CompetitionListItem";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import {
  athleteAtom,
  recentResultsAtom,
  unseenNotificationCountAtom,
  upcomingRegistrationsAtom,
} from "@/lib/atoms";
import {
  formatCompetitionClass,
  formatCompetitionDiscipline,
  formatDateRange,
} from "@/lib/competition-format";
import { getAgeLabel, getDateMs, parseCdsfDate } from "@/lib/cdsf";
import { dismissResultNotification } from "@/lib/notify";
import { sync } from "@/lib/sync";
import type { Athlete, EventRegistration } from "@/lib/types";

type RankingPoint = NonNullable<Athlete["rankingPoints"]>[number];

function getWeekStart(dateString: string) {
  const date = parseCdsfDate(dateString);
  if (!date) return Number.NEGATIVE_INFINITY;
  const dayFromMonday = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - dayFromMonday);
  return date.getTime();
}

function selectClosestWeek(events: EventRegistration[], future: boolean) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidates = events
    .filter((event) => !future || getDateMs(event.date) >= today.getTime())
    .sort((left, right) => {
      const dates = getDateMs(left.date) - getDateMs(right.date);
      return (
        (future ? dates : -dates) ||
        left.eventName.localeCompare(right.eventName, "cs")
      );
    });
  const week = candidates[0] ? getWeekStart(candidates[0].date) : null;
  return week === null
    ? []
    : candidates.filter((event) => getWeekStart(event.date) === week);
}

function formatEventRange(events: EventRegistration[]) {
  const dates = events.map((event) => event.date).sort();
  return formatDateRange(dates[0], dates.at(-1));
}

function getRankingPoints(athlete: Athlete | null): RankingPoint[] {
  if (!athlete) return [];
  return athlete.rankingPoints?.length
    ? athlete.rankingPoints
    : [athlete.stt, athlete.lat, athlete.ten].filter(
        (point): point is RankingPoint => point !== undefined,
      );
}

export default function DashboardScreen() {
  const router = useRouter();
  const athlete = useAtomValue(athleteAtom);
  const upcomingWeek = selectClosestWeek(
    useAtomValue(upcomingRegistrationsAtom),
    true,
  );
  const resultWeek = selectClosestWeek(useAtomValue(recentResultsAtom), false);
  const announcementCount = useAtomValue(unseenNotificationCountAtom);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await sync({ trigger: "manual" }).catch(() => {});
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <AnnouncementButton
              count={announcementCount}
              onPress={() => router.push("/announcements")}
            />
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ProfileSummary
          athlete={athlete}
          onPress={() => router.push("/profile")}
        />

        <Section
          action="Všechny přihlášky"
          date={
            upcomingWeek.length ? formatEventRange(upcomingWeek) : undefined
          }
          onPress={() => router.push("/competitions/registered")}
          title="Nejbližší soutěžní víkend"
        >
          {upcomingWeek.length ? (
            upcomingWeek.map((event) => {
              const eventId = event.eventId;
              return (
                <CompetitionListItem
                  event={event}
                  key={eventId ?? `${event.eventName}:${event.date}`}
                  onPressEvent={() =>
                    eventId
                      ? router.push({
                          pathname: "/competitions/events/[eventId]",
                          params: { eventId },
                        })
                      : router.push("/competitions/registered")
                  }
                />
              );
            })
          ) : (
            <ScreenStateCard
              body="Další přihlášené soutěže se zobrazí tady."
              style={styles.stateCard}
              title="Žádná nadcházející soutěž"
            />
          )}
        </Section>

        <Section
          action="Všechny výsledky"
          date={resultWeek.length ? formatEventRange(resultWeek) : undefined}
          onPress={() => router.push("/competitions/results")}
          title="Poslední soutěžní víkend"
        >
          {resultWeek.length ? (
            resultWeek.map((event) => {
              const eventId = event.eventId;
              return (
                <CompetitionListItem
                  event={event}
                  key={eventId ?? `${event.eventName}:${event.date}`}
                  onPressCompetition={(competitionId) => {
                    void dismissResultNotification(competitionId);
                    router.push({
                      pathname: "/competitions/[competitionId]/result",
                      params: {
                        competitionId,
                        ...(eventId ? { eventId } : {}),
                      },
                    });
                  }}
                  onPressEvent={
                    eventId
                      ? () =>
                          router.push({
                            pathname: "/competitions/events/[eventId]",
                            params: { eventId },
                          })
                      : undefined
                  }
                  variant="results"
                />
              );
            })
          ) : (
            <ScreenStateCard
              body="Výsledky posledního soutěžního víkendu se zobrazí tady."
              style={styles.stateCard}
              title="Zatím žádné výsledky"
            />
          )}
        </Section>
      </ScrollView>
    </>
  );
}

function AnnouncementButton({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={
        count ? `Aktuality, ${count} nepřečtených` : "Aktuality"
      }
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
    >
      <SymbolView
        name={{
          ios: "bell.fill",
          android: "notifications",
          web: "notifications",
        }}
        size={19}
        tintColor={Colors.light.tint}
      />
      {count ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function ProfileSummary({
  athlete,
  onPress,
}: {
  athlete: Athlete | null;
  onPress: () => void;
}) {
  const points = getRankingPoints(athlete);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.profile, pressed && styles.pressed]}
    >
      <View style={styles.profileHeader}>
        <View style={styles.grow}>
          <Text style={styles.eyebrow}>Moje výkonnost</Text>
          <Text style={styles.profileName}>
            {athlete?.name ?? "Můj profil"}
          </Text>
          {athlete ? (
            <Text style={styles.muted}>{getAgeLabel(athlete.age)}</Text>
          ) : null}
        </View>
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={18}
          tintColor="#69788c"
        />
      </View>
      {points.length ? (
        <View style={styles.points}>
          {points.map((point) => {
            const competitionClass = formatCompetitionClass(
              point.personalClass ?? point.class,
            );
            const pointValue = point.personalPoints ?? point.points;
            return (
              <View
                key={`${point.id}:${point.discipline}:${point.rankingPointsAge}`}
                style={styles.pointRow}
              >
                <Text style={styles.discipline}>
                  {formatCompetitionDiscipline(point.discipline)}
                </Text>
                <Text style={styles.pointValue}>
                  {[
                    competitionClass ? `Třída ${competitionClass}` : undefined,
                    typeof pointValue === "number"
                      ? `${pointValue} bodů`
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Bez bodů"}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.noPoints}>Třídy a body zatím nejsou dostupné.</Text>
      )}
    </Pressable>
  );
}

function Section({
  action,
  children,
  date,
  onPress,
  title,
}: {
  action: string;
  children: ReactNode;
  date?: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.grow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {date ? <Text style={styles.muted}>{date}</Text> : null}
        </View>
        <Pressable accessibilityRole="link" onPress={onPress}>
          {({ pressed }) => (
            <Text style={[styles.action, pressed && styles.pressed]}>
              {action}
            </Text>
          )}
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingHorizontal: 6,
    paddingTop: 14,
    paddingBottom: 32,
  },
  grow: { flex: 1 },
  pressed: { opacity: 0.6 },
  bell: {
    minWidth: 38,
    minHeight: 38,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#dbe3ed",
    backgroundColor: "#f8fbff",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -6,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#f4f7fb",
    backgroundColor: "#d73a49",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800", lineHeight: 11 },
  profile: {
    overflow: "hidden",
    marginHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d9e2ed",
    backgroundColor: "#fff",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyebrow: {
    color: Colors.light.tint,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  profileName: {
    color: "#182334",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  muted: { color: "#69788c", fontSize: 12, fontWeight: "600", marginTop: 2 },
  points: {
    borderTopWidth: 1,
    borderTopColor: "#edf1f6",
    backgroundColor: "#f8fafd",
    paddingVertical: 3,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  discipline: { color: "#2457b3", fontSize: 12, fontWeight: "800" },
  pointValue: {
    flex: 1,
    color: "#26364a",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  noPoints: {
    borderTopWidth: 1,
    borderTopColor: "#edf1f6",
    color: "#778598",
    fontSize: 13,
    padding: 14,
  },
  section: { gap: 7 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 12,
  },
  sectionTitle: { color: "#223045", fontSize: 16, fontWeight: "800" },
  action: {
    color: Colors.light.tint,
    fontSize: 11.5,
    fontWeight: "800",
    paddingVertical: 2,
  },
  stateCard: { marginHorizontal: 10 },
});
