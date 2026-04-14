import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CompetitionDetailRow } from "@/components/CompetitionScreenParts";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { competitionEventAtom } from "@/lib/competition-detail-query";
import {
  formatCompetitionLabel,
  formatDateRange,
} from "@/lib/competition-format";
import { competitionRegistrationsAtom } from "@/lib/competition-registrations-query";
import { detailScreenStyles } from "@/lib/competition-screen-styles";
import { getRouteId } from "@/lib/competition-routes";
import { formatSimpleDateTime } from "@/lib/cdsf";

export default function CompetitionEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string | string[] }>();
  const eventId = getRouteId(params.eventId);
  const eventQuery = useAtomValue(competitionEventAtom(eventId ?? 0));
  const registrationsQuery = useAtomValue(competitionRegistrationsAtom);

  if (!eventId) {
    return <Redirect href="/+not-found" />;
  }

  const registrations = (registrationsQuery.data?.pages ?? []).flatMap(
    (page) => page.collection || [],
  );
  const myEvent = registrations.find((item) => item.eventId === eventId);
  const event = eventQuery.data?.entity;
  const title = event?.eventTitle ?? myEvent?.eventName ?? "Událost";

  if (eventQuery.isLoading) {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.container}
      >
        <Stack.Screen options={{ title }} />
        <ScreenStateCard
          body="Detail soutěžní akce se načítá."
          isLoading
          title="Načítám detail akce"
        />
      </ScrollView>
    );
  }

  if (eventQuery.isError || !event) {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.container}
      >
        <Stack.Screen options={{ title }} />
        <ScreenStateCard
          body="Zkuste načtení zopakovat."
          onRetry={() => {
            void eventQuery.refetch();
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

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Stack.Screen options={{ title }} />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Soutěžní akce</Text>
        <Text style={styles.title}>{event.eventTitle}</Text>
        <Text style={styles.meta}>
          {formatDateRange(event.dateFrom, event.dateTo)}
        </Text>
        <Text style={styles.location}>{event.location}</Text>
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
          <CompetitionDetailRow label="Místo" value={event.location} />
          <CompetitionDetailRow label="Organizátor" value={event.organizer} />
          <CompetitionDetailRow label="Pořadatel" value={event.promoter} />
          <CompetitionDetailRow
            label="Úředníci"
            value={
              event.officials.length
                ? `${event.officials.length} osob`
                : undefined
            }
          />
          <CompetitionDetailRow label="GPS" value={myEvent?.gps} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...detailScreenStyles,
  title: {
    color: "#182334",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 30,
    marginTop: 8,
  },
  meta: {
    color: "#2457b3",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 8,
    textTransform: "uppercase",
  },
  location: {
    color: "#223045",
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 10,
  },
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
