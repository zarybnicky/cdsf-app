import type { components } from "@/CDSF";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import ScreenStateCard from "@/components/ScreenStateCard";
import { eventsAtom, registrationsAtom, resultsSummaryAtom } from "@/lib/atoms";
import {
  formatCompetitionLabel,
  formatDateRange,
} from "@/lib/competition-format";
import { refreshCompetitionEvent } from "@/lib/competition-details";
import { formatSimpleDateTime } from "@/lib/cdsf";
import { withHeaderSubtitle } from "@/lib/navigation-header";
import type { Event, EventDetails, EventRegistration } from "@/lib/types";

type EventTab = "overview" | "competitions" | "officials";
type EventCompetition = Event["competitions"][number];
type EventOfficial = Event["officials"][number];
type OfficialType = components["schemas"]["OfficialType"];

const tabs: { key: EventTab; label: string }[] = [
  { key: "overview", label: "Přehled" },
  { key: "competitions", label: "Soutěže" },
  { key: "officials", label: "Porota a funkcionáři" },
];

const officialGroups: { key: string; title: string; types: OfficialType[] }[] =
  [
    { key: "chairpersons", title: "Vedoucí soutěže", types: ["ChP"] },
    { key: "jury", title: "Porota", types: ["Adj"] },
    {
      key: "invigilators",
      title: "Odborný dozor",
      types: ["Inv", "Scr", "LScr", "SInv"],
    },
    { key: "masters-of-ceremony", title: "Moderátoři", types: ["MoC"] },
  ];

function formatRegistrationState(
  state?: components["schemas"]["RegistrationState"],
) {
  switch (state) {
    case "Planned":
      return "Plánované";
    case "Open":
      return "Otevřené";
    case "Closed":
      return "Uzavřené";
    default:
      return state;
  }
}

function EventTabs({
  activeTab,
  onChange,
}: {
  activeTab: EventTab;
  onChange: (tab: EventTab) => void;
}) {
  return (
    <View style={styles.tabs}>
      {tabs.map(({ key, label }) => {
        const isActive = key === activeTab;

        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(key)}
            style={({ pressed }) => [
              styles.tab,
              isActive ? styles.tabActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[styles.tabText, isActive ? styles.tabTextActive : null]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type Detail = { label: string; value?: string };

function DetailSection({ title, rows }: { title: string; rows: Detail[] }) {
  const visibleRows = rows.filter(({ value }) => value);

  if (!visibleRows.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.detailCard}>
        {visibleRows.map(({ label, value }) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text selectable style={styles.detailValue}>
              {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatAddress(details: EventDetails) {
  const city = [details.zipCode, details.city].filter(Boolean).join(" ");
  return [details.street, city].filter(Boolean).join(", ") || undefined;
}

function OverviewTab({ event }: { event: Event }) {
  const details = event.details;

  return (
    <>
      <DetailSection
        rows={[
          { label: "Adresa", value: formatAddress(details) },
          { label: "Upřesnění místa", value: details.addressNote?.trim() },
          { label: "GPS", value: details.gps?.trim() },
          { label: "Parket", value: details.danceFloor?.trim() },
          { label: "Otevření sálu", value: details.hallOpening?.trim() },
          {
            label: "Začátek soutěží",
            value: details.competitionsStart?.trim(),
          },
          {
            label: "Porada poroty",
            value: formatSimpleDateTime(details.juryMeeting),
          },
        ]}
        title="Místo a čas"
      />
      <DetailSection
        rows={[
          {
            label: "Kontaktní osoba",
            value: details.responsiblePerson?.trim(),
          },
          { label: "Telefon", value: details.phone?.trim() },
          { label: "E-mail", value: details.email?.trim() },
          { label: "Web", value: details.promoterWeb?.trim() },
        ]}
        title="Kontakt"
      />
      <DetailSection
        rows={[
          { label: "Organizátor", value: details.organizer?.trim() },
          { label: "Pořadatel", value: details.promoter?.trim() },
          { label: "Spolupořadatel", value: details.coOrganizer?.trim() },
          { label: "Podpora", value: details.supporter?.trim() },
          { label: "Propagace", value: details.promoterPropagation?.trim() },
        ]}
        title="Pořadatelé"
      />
      <DetailSection
        rows={[
          { label: "Hudba", value: details.music?.trim() },
          { label: "Vstupné", value: details.entranceFee?.trim() },
          { label: "Ceny", value: details.prizes?.trim() },
          { label: "Náhrady nákladů", value: details.costs?.trim() },
          { label: "Bankovní účet", value: details.bankAccount?.trim() },
          { label: "Poznámka", value: details.note?.trim() },
        ]}
        title="Další informace"
      />
      <DetailSection
        rows={[
          {
            label: "Termín přihlášek",
            value: formatSimpleDateTime(details.registrationDeadline),
          },
          {
            label: "Termín omluv",
            value: formatSimpleDateTime(details.excuseDeadline),
          },
        ]}
        title="Termíny"
      />
      <DetailSection
        rows={[
          {
            label: "Přihlášky",
            value: formatRegistrationState(event.registrationState),
          },
        ]}
        title="Stav"
      />
    </>
  );
}

function CompetitionRow({
  competition,
  eventId,
  isMine,
}: {
  competition: EventCompetition;
  eventId: number;
  isMine: boolean;
}) {
  const router = useRouter();
  const isComplete = Boolean(competition.completedAt);
  const attendance =
    typeof competition.registered === "number"
      ? `Přihlášeno ${competition.registered - (competition.excused ?? 0)}`
      : undefined;
  const timing = competition.checkInEnd
    ? `Prezence do ${competition.checkInEnd}`
    : undefined;
  const fee =
    typeof competition.registrationFee === "number"
      ? `Startovné ${competition.registrationFee} Kč`
      : undefined;
  const meta = [timing, attendance, fee].filter(Boolean).join(" · ");

  return (
    <Pressable
      accessibilityLabel={`${formatCompetitionLabel(competition)}, ${isComplete ? "zobrazit výsledky" : "zobrazit startovní listinu"}`}
      accessibilityRole="link"
      onPress={() =>
        router.push({
          pathname: isComplete
            ? "/competitions/[competitionId]/result"
            : "/competitions/[competitionId]/startlist",
          params: { competitionId: competition.competitionId, eventId },
        })
      }
      style={({ pressed }) => [
        styles.competitionRow,
        pressed ? styles.rowPressed : null,
      ]}
    >
      <View style={styles.rowCopy}>
        <View style={styles.competitionTitleRow}>
          <Text style={styles.rowTitle}>
            {formatCompetitionLabel(competition)}
          </Text>
          {isMine ? <Text style={styles.mineBadge}>Moje</Text> : null}
        </View>
        {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
      </View>
      <Text accessibilityElementsHidden style={styles.chevron}>
        ›
      </Text>
    </Pressable>
  );
}

function CompetitionsTab({
  event,
  eventId,
  registration,
}: {
  event: Event;
  eventId: number;
  registration?: EventRegistration;
}) {
  const mine = new Set(
    registration?.competitions.map(({ competitionId }) => competitionId) ?? [],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Soutěže · {event.competitions.length}
      </Text>
      <View style={styles.listCard}>
        {event.competitions.map((competition) => (
          <CompetitionRow
            competition={competition}
            eventId={eventId}
            isMine={mine.has(competition.competitionId)}
            key={competition.competitionId}
          />
        ))}
      </View>
    </View>
  );
}

function OfficialsTab({ officials }: { officials: EventOfficial[] }) {
  const groups = [
    ...officialGroups.map((group) => ({
      ...group,
      officials: officials.filter((official) =>
        official.licences?.some((licence) =>
          group.types.includes(licence.type),
        ),
      ),
    })),
    {
      key: "other",
      title: "Ostatní",
      officials: officials.filter((official) => !official.licences?.length),
    },
  ].filter(({ officials: group }) => group.length > 0);

  return (
    <>
      {groups.map((group) => (
        <View key={group.key} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {group.title}
            {group.key === "other" ? "" : ` · ${group.officials.length}`}
          </Text>
          <View style={styles.listCard}>
            {group.officials.map((official) => (
              <View
                key={official.id ?? `${official.name}:${official.surname}`}
                style={styles.officialRow}
              >
                <Text style={[styles.rowTitle, styles.officialName]}>
                  {official.name} {official.surname}
                </Text>
                {official.country ? (
                  <Text style={styles.officialCountry}>{official.country}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

export default function CompetitionEventScreen() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  const parsedEventId = Number(params.eventId);
  const eventId =
    Number.isInteger(parsedEventId) && parsedEventId > 0 ? parsedEventId : null;
  const registrations = useAtomValue(registrationsAtom);
  const results = useAtomValue(resultsSummaryAtom);
  const event = useAtomValue(eventsAtom)[eventId ?? 0];
  const [activeTab, setActiveTab] = useState<EventTab>("overview");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    event?.details ? "ready" : "loading",
  );

  useEffect(() => {
    if (!eventId) return;
    void refreshCompetitionEvent(eventId).then(
      () => setLoadState("ready"),
      () => setLoadState("error"),
    );
  }, [eventId]);

  if (!eventId) return <Redirect href="/+not-found" />;

  const registration =
    registrations.find((item) => item.eventId === eventId) ??
    results.find((item) => item.eventId === eventId);
  const title = event?.eventTitle ?? registration?.eventName ?? "Událost";
  const summary = event
    ? [formatDateRange(event.dateFrom, event.dateTo), event.location]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  if (!event?.details) {
    const isLoading = loadState === "loading";
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        style={styles.container}
      >
        <Stack.Screen options={withHeaderSubtitle(title, summary)} />
        <ScreenStateCard
          body={
            isLoading
              ? "Detail soutěžní akce se načítá."
              : "Zkuste načtení zopakovat."
          }
          isLoading={isLoading}
          onRetry={
            isLoading
              ? undefined
              : () => {
                  setLoadState("loading");
                  void refreshCompetitionEvent(eventId).then(
                    () => setLoadState("ready"),
                    () => setLoadState("error"),
                  );
                }
          }
          title={
            isLoading ? "Načítám detail akce" : "Detail se nepodařilo načíst"
          }
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Stack.Screen options={withHeaderSubtitle(title, summary)} />

      <EventTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <OverviewTab event={event} />
      ) : activeTab === "competitions" ? (
        <CompetitionsTab
          event={event}
          eventId={eventId}
          registration={registration}
        />
      ) : (
        <OfficialsTab officials={event.officials} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  tabs: {
    flexDirection: "row",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#dce4ed",
    backgroundColor: "#e8edf3",
    padding: 3,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  tabActive: {
    borderWidth: 1,
    borderColor: "#d5dee9",
    backgroundColor: "#fff",
  },
  tabText: {
    color: "#6f7d8f",
    fontSize: 11.5,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  tabTextActive: {
    color: "#2457b3",
  },
  pressed: {
    opacity: 0.75,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dbe2eb",
  },
  detailLabel: {
    color: "#728093",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#223045",
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
    marginTop: 3,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dde4ed",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  competitionRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dbe2eb",
  },
  officialRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dbe2eb",
  },
  officialName: {
    flex: 1,
  },
  officialCountry: {
    color: "#667487",
    fontSize: 11.5,
    fontWeight: "700",
  },
  rowPressed: {
    backgroundColor: "#f2f6fb",
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  competitionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  rowTitle: {
    color: "#223045",
    flexShrink: 1,
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 18,
  },
  rowMeta: {
    color: "#667487",
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  mineBadge: {
    borderRadius: 999,
    backgroundColor: "#e7effc",
    color: "#2457b3",
    fontSize: 9.5,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chevron: {
    color: "#8490a0",
    fontSize: 24,
    lineHeight: 26,
    marginLeft: 10,
  },
});
