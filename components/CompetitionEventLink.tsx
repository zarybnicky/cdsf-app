import { useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { eventsAtom, registrationsAtom, resultsSummaryAtom } from "@/lib/atoms";
import { formatDateRange } from "@/lib/competition-format";
import { formatSimpleDate } from "@/lib/cdsf";

type Props = {
  eventId: number;
  style?: StyleProp<ViewStyle>;
};

export default function CompetitionEventLink({ eventId, style }: Props) {
  const router = useRouter();
  const events = useAtomValue(eventsAtom);
  const registrations = useAtomValue(registrationsAtom);
  const results = useAtomValue(resultsSummaryAtom);
  const summary =
    registrations.find((candidate) => candidate.eventId === eventId) ??
    results.find((candidate) => candidate.eventId === eventId);
  const event = events[eventId];
  const title = event?.eventTitle ?? summary?.eventName;
  const date = event?.dateFrom
    ? formatDateRange(event.dateFrom, event.dateTo)
    : formatSimpleDate(summary?.date);
  const location = event?.location ?? summary?.city;
  const meta = [date, location].filter(Boolean).join(" · ");

  const content = (
    <>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Soutěžní akce</Text>
        <Text style={styles.title}>{title ?? "Detail soutěžní akce"}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <Text accessibilityElementsHidden style={styles.chevron}>
        ›
      </Text>
    </>
  );

  return (
    <Pressable
      accessibilityLabel={`Zobrazit akci ${title ?? "soutěže"}`}
      accessibilityRole="link"
      onPress={() =>
        router.navigate({
          pathname: "/competitions/events/[eventId]",
          params: { eventId },
        })
      }
      style={({ pressed }) => [
        styles.card,
        style,
        pressed ? styles.pressed : null,
      ]}
    >
      {content}
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
