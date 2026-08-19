import { eventsAtom, registrationsAtom, resultsSummaryAtom } from "@/lib/atoms";
import { formatSimpleDate } from "@/lib/cdsf";
import { formatDateRange } from "@/lib/competition-format";
import { useNavigation, useRouter } from "expo-router";
import type { NavigationState } from "expo-router/react-navigation";
import { useAtomValue } from "jotai";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  eventId: number;
  style?: StyleProp<ViewStyle>;
};

function isPreviousEvent(state: NavigationState | undefined, eventId: number) {
  const route = state?.routes[state.index - 1];
  return (
    route?.name === "events/[eventId]" &&
    route.params !== undefined &&
    "eventId" in route.params &&
    Number(route.params.eventId) === eventId
  );
}

export default function CompetitionEventLink({ eventId, style }: Props) {
  const navigation = useNavigation();
  const router = useRouter();
  const events = useAtomValue(eventsAtom);
  const registrations = useAtomValue(registrationsAtom);
  const results = useAtomValue(resultsSummaryAtom);
  const summary =
    registrations.find((x) => x.eventId === eventId) ??
    results.find((x) => x.eventId === eventId);
  const event = events[eventId];
  const title = event?.eventTitle ?? summary?.eventName;
  const date = event?.dateFrom
    ? formatDateRange(event.dateFrom, event.dateTo)
    : formatSimpleDate(summary?.date);
  const meta = [date, event?.location ?? summary?.city]
    .filter(Boolean)
    .join(" · ");

  function openEvent() {
    if (isPreviousEvent(navigation.getState(), eventId)) {
      router.back();
      return;
    }
    router.push({
      pathname: "/competitions/events/[eventId]",
      params: { eventId },
    });
  }

  return (
    <Pressable
      accessibilityLabel={`Zobrazit ${title}`}
      accessibilityRole="link"
      onPress={openEvent}
      style={({ pressed }) => [
        styles.card,
        style,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Soutěž</Text>
        <Text style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <Text accessibilityElementsHidden style={styles.chevron}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7dee8",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: "#2457b3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#223045",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 3,
  },
  meta: {
    color: "#6a7788",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  chevron: {
    color: "#7a8798",
    fontSize: 26,
    lineHeight: 28,
    marginLeft: 12,
  },
  pressed: {
    backgroundColor: "#f7f9fc",
  },
});
