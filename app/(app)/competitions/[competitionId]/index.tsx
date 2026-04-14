import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  CompetitionActionCard,
  CompetitionDetailRow,
} from "@/components/CompetitionScreenParts";
import ScreenStateCard from "@/components/ScreenStateCard";
import { Text } from "@/components/Themed";
import { competitionDetailAtom } from "@/lib/competition-detail-query";
import {
  formatCompetitionClass,
  formatCompetitionDiscipline,
  formatCompetitionGrade,
  formatCompetitionLabel,
} from "@/lib/competition-format";
import { detailScreenStyles } from "@/lib/competition-screen-styles";
import { getRouteId } from "@/lib/competition-routes";
import { formatSimpleDate, formatSimpleDateTime, getAgeLabel } from "@/lib/cdsf";

export default function CompetitionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    competitionId?: string | string[];
    eventId?: string | string[];
  }>();
  const competitionId = getRouteId(params.competitionId);
  const eventId = getRouteId(params.eventId);
  const query = useAtomValue(competitionDetailAtom(competitionId ?? 0));
  const competition = query.data?.entity;
  const title = competition ? formatCompetitionLabel(competition) : "Soutěž";

  if (!competitionId) {
    return <Redirect href="/+not-found" />;
  }

  if (query.isLoading) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.container}>
        <Stack.Screen options={{ title }} />
        <ScreenStateCard
          body="Detail soutěže se načítá."
          isLoading
          title="Načítám detail soutěže"
        />
      </ScrollView>
    );
  }

  if (query.isError || !competition) {
    return (
      <ScrollView contentContainerStyle={styles.content} style={styles.container}>
        <Stack.Screen options={{ title }} />
        <ScreenStateCard
          body="Zkuste načtení zopakovat."
          onRetry={() => {
            void query.refetch();
          }}
          title="Nepodařilo se načíst detail soutěže"
        />
      </ScrollView>
    );
  }

  const routeParams = eventId ? { competitionId, eventId } : { competitionId };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Stack.Screen options={{ title }} />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Soutěž</Text>
        <Text style={styles.title}>{formatCompetitionLabel(competition)}</Text>
        {competition.date ? (
          <Text style={styles.meta}>
            {formatSimpleDate(competition.date)}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <CompetitionActionCard
          body="Zobrazit registrované a omluvené soutěžící."
          onPress={() => {
            router.replace({
              pathname: "/competitions/[competitionId]/startlist",
              params: routeParams,
            });
          }}
          title="Startovní listina"
        />
        <CompetitionActionCard
          body="Otevřít samostatnou obrazovku s výsledkem soutěže."
          onPress={() => {
            router.replace({
              pathname: "/competitions/[competitionId]/result",
              params: routeParams,
            });
          }}
          title="Výsledek"
        />
        {eventId ? (
          <CompetitionActionCard
            body="Vrátit se na detail soutěžní akce."
            onPress={() => {
              router.push({
                pathname: "/competitions/events/[eventId]",
                params: { eventId },
              });
            }}
            title="Událost"
          />
        ) : null}
      </View>

      <View style={styles.detailCard}>
        <CompetitionDetailRow label="ID soutěže" value={competitionId.toString()} />
        <CompetitionDetailRow
          label="Disciplína"
          value={formatCompetitionDiscipline(competition.discipline)}
        />
        <CompetitionDetailRow
          label="Věková kategorie"
          value={getAgeLabel(competition.age)}
        />
        <CompetitionDetailRow
          label="Třída"
          value={formatCompetitionClass(competition.class)}
        />
        <CompetitionDetailRow
          label="Výkonnost"
          value={
            formatCompetitionGrade(competition.grade) ?? competition.grade
          }
        />
        <CompetitionDetailRow
          label="Prezence do"
          value={formatSimpleDateTime(competition.checkInEnd)}
        />
        <CompetitionDetailRow
          label="Startovné"
          value={
            typeof competition.registrationFee === "number"
              ? `${competition.registrationFee} Kč`
              : undefined
          }
        />
        <CompetitionDetailRow
          label="Přihlášeno"
          value={
            typeof competition.registered === "number"
              ? competition.registered.toString()
              : undefined
          }
        />
        <CompetitionDetailRow
          label="Omluveno"
          value={
            typeof competition.excused === "number"
              ? competition.excused.toString()
              : undefined
          }
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ...detailScreenStyles,
  title: {
    color: "#182334",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 28,
    marginTop: 8,
  },
  meta: {
    color: "#2457b3",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 8,
    textTransform: "uppercase",
  },
  actions: {
    gap: 8,
  },
});
