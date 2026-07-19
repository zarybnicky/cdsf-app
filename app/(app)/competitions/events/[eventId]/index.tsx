import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { eventsAtom, registrationsAtom } from "@/lib/atoms";
import {
  formatCompetitionLabel,
  formatDateRange,
} from "@/lib/competition-format";
import { detailScreenStyles } from "@/lib/competition-screen-styles";
import { withHeaderSubtitle } from "@/lib/navigation-header";
import { formatSimpleDateTime } from "@/lib/cdsf";
import { refreshCompetitionEvent } from "@/lib/competition-details";

export default function CompetitionEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const parsedEventId = Number(params.eventId);
  const eventId =
    Number.isInteger(parsedEventId) && parsedEventId > 0 ? parsedEventId : null;
  const registrations = useAtomValue(registrationsAtom);
  const storedEvent = useAtomValue(eventsAtom)[eventId ?? 0];
  const event =
    storedEvent && "competitions" in storedEvent ? storedEvent : null;
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    event ? "ready" : "loading",
  );

  useEffect(() => {
    if (!eventId) return;
    void refreshCompetitionEvent(eventId).then(
      () => setLoadState("ready"),
      () => setLoadState("error"),
    );
  }, [eventId]);

  if (!eventId) {
    return <Redirect href="/+not-found" />;
  }

  const myEvent = registrations.find((item) => item.eventId === eventId);
  const title = event?.eventTitle ?? myEvent?.eventName ?? "Událost";
  const summary = event
    ? [formatDateRange(event.dateFrom, event.dateTo), event.location]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  if (loadState === "loading" && !event) {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.container}
      >
        <Stack.Screen options={withHeaderSubtitle(title, summary)} />
        <ScreenStateCard
          body="Detail soutěžní akce se načítá."
          isLoading
          title="Načítám detail akce"
        />
      </ScrollView>
    );
  }

  if (!event) {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.container}
      >
        <Stack.Screen options={withHeaderSubtitle(title, summary)} />
        <ScreenStateCard
          body="Zkuste načtení zopakovat."
          onRetry={() => {
            setLoadState("loading");
            void refreshCompetitionEvent(eventId).then(
              () => setLoadState("ready"),
              () => setLoadState("error"),
            );
          }}
          title="Nepodařilo se načíst detail akce"
        />
      </ScrollView>
    );
  }

  const competitionSections = [
    {
      title: "Moje přihlášky",
      rows: (myEvent?.competitions ?? []).map((competition) => ({
        competitionId: competition.competitionId,
        label: formatCompetitionLabel(competition),
        meta: competition.checkInEnd
          ? `Prezence do ${formatSimpleDateTime(competition.checkInEnd)}`
          : "Zobrazit registrované",
      })),
    },
    {
      title: "Všechny soutěže v akci",
      rows: event.competitions.map((competition) => ({
        competitionId: competition.competitionId,
        label: formatCompetitionLabel(competition),
        meta:
          typeof competition.registered === "number" ||
          typeof competition.excused === "number"
            ? `Přihlášeno ${competition.registered ?? 0} · Omluveno ${competition.excused ?? 0}`
            : "Zobrazit registrované",
      })),
    },
  ].filter(({ rows }) => rows.length > 0);
  const infoRows = [
    { label: "Místo", value: event.location?.trim() },
    { label: "Organizátor", value: event.organizer?.trim() },
    { label: "Pořadatel", value: event.promoter?.trim() },
    {
      label: "Úředníci",
      value: event.officials.length
        ? `${event.officials.length} osob`
        : undefined,
    },
    { label: "GPS", value: myEvent?.gps?.trim() },
  ].filter((row): row is { label: string; value: string } =>
    Boolean(row.value),
  );

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Stack.Screen options={withHeaderSubtitle(title, summary)} />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Soutěžní akce</Text>
        {myEvent?.address?.trim() ? (
          <Text style={styles.supporting}>{myEvent.address.trim()}</Text>
        ) : null}
      </View>

      {competitionSections.map(({ title, rows }) => (
        <View key={title} style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.linkCard}>
            {rows.map((competition, index) => (
              <Pressable
                key={competition.competitionId}
                accessibilityRole="link"
                onPress={() => {
                  router.push({
                    pathname: "/competitions/[competitionId]/startlist",
                    params: {
                      competitionId: competition.competitionId,
                      eventId,
                    },
                  });
                }}
                style={({ pressed }) => [
                  styles.linkRow,
                  index < rows.length - 1 ? styles.linkRowBorder : null,
                  pressed ? styles.linkRowPressed : null,
                ]}
              >
                <Text style={styles.linkTitle}>{competition.label}</Text>
                <Text style={styles.linkMeta}>{competition.meta}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informace</Text>
        <View style={styles.detailCard}>
          {infoRows.map(({ label, value }) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...detailScreenStyles,
  supporting: {
    color: "#667487",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: "#223045",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 2,
  },
  detailRow: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f6",
  },
  detailLabel: {
    color: "#728093",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#223045",
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 4,
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  linkRow: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  linkRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#edf1f6",
  },
  linkRowPressed: {
    backgroundColor: "#f7f9fc",
  },
  linkTitle: {
    color: "#223045",
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 18,
  },
  linkMeta: {
    color: "#617185",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
});
