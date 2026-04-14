import type { components } from "@/CDSF";

import { formatSimpleDate, getAgeLabel } from "@/lib/cdsf";

type CompetitionLike = {
  age: components["schemas"]["Age"];
  class?: components["schemas"]["RankingClass"] | string | null;
  discipline: components["schemas"]["Discipline"];
  grade?: components["schemas"]["CompetitionGrade"];
};

type NamedCompetitor = Partial<
  Pick<
    components["schemas"]["Competitor"],
    "captain" | "couplesOrDuos" | "name" | "persons"
  >
> &
  Partial<
    Pick<
      components["schemas"]["CompetitorResultCompetitor"],
      "name1" | "name2" | "surname1" | "surname2"
    >
  >;

type SourcedCompetitor = Pick<
  components["schemas"]["Competitor"],
  "captain" | "club" | "country"
>;

function joinName(...parts: Array<string | undefined>) {
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function formatCompetitionClass(value?: string | null) {
  return !value || value === "Open" || value === "Unknown" ? undefined : value;
}

export function formatCompetitionGrade(
  grade?: components["schemas"]["CompetitionGrade"],
) {
  switch (grade) {
    case "Championship":
      return "MČR";
    case "League":
      return "TL";
    case "SuperLeague":
      return "STL";
    default:
      return undefined;
  }
}

export function formatCompetitionDiscipline(
  discipline: components["schemas"]["Discipline"],
) {
  switch (discipline) {
    case "Standard":
      return "STT";
    case "Latin":
      return "LAT";
    case "TenDances":
      return "10T";
    case "Standard+Latin":
      return "STT + LAT";
    case "SingleOfTenDances":
      return "Single 10T";
    case "FreeStyle":
      return "Freestyle";
    default:
      return discipline;
  }
}

export function formatCompetitionLabel(competition: CompetitionLike) {
  const label = [
    formatCompetitionGrade(competition.grade),
    getAgeLabel(competition.age),
    formatCompetitionClass(competition.class),
    formatCompetitionDiscipline(competition.discipline),
  ]
    .filter(Boolean)
    .join(" ");

  return label || "Soutěž";
}

export function formatCompetitionPlacement(
  ranking?: number,
  rankingTo?: number,
  competitorsCount?: number,
) {
  if (typeof ranking !== "number") {
    return undefined;
  }

  const rankingLabel =
    typeof rankingTo === "number" && rankingTo > ranking
      ? `${ranking}-${rankingTo}`
      : `${ranking}`;

  if (typeof competitorsCount === "number" && competitorsCount > 0) {
    return `${rankingLabel}\u2009/\u2009${competitorsCount}`;
  }

  if (typeof rankingTo === "number" && rankingTo > ranking) {
    return `${ranking}.-${rankingTo}.`;
  }

  return `${ranking}.`;
}

export function formatDateRange(dateFrom?: string, dateTo?: string) {
  const from = formatSimpleDate(dateFrom);
  const to = formatSimpleDate(dateTo);

  if (from && to && from !== to) {
    return `${from} - ${to}`;
  }

  return from || to || "Datum není k dispozici";
}

export function formatCompetitorName(
  competitor?: NamedCompetitor,
  fallback?: string,
) {
  if (!competitor) {
    return fallback ?? "Soutěžící";
  }

  const first = joinName(competitor.name1, competitor.surname1);
  const second = joinName(competitor.name2, competitor.surname2);

  if (first && second) {
    return `${first} - ${second}`;
  }

  if (first) {
    return first;
  }

  const name = competitor.name?.trim();

  if (name) {
    return name;
  }

  if (competitor.couplesOrDuos?.length) {
    return competitor.couplesOrDuos
      .map(
        ({ name1, name2, surname1, surname2 }) =>
          `${joinName(name1, surname1)} / ${joinName(name2, surname2)}`,
      )
      .join(", ");
  }

  if (competitor.persons?.length) {
    return competitor.persons
      .map(({ name: personName, surname }) => joinName(personName, surname))
      .join(", ");
  }

  if (competitor.captain?.trim()) {
    return competitor.captain.trim();
  }

  if (fallback) {
    return fallback;
  }

  return "Soutěžící";
}

export function formatCompetitorSource(competitor: SourcedCompetitor) {
  if (competitor.club?.trim()) {
    return competitor.club.trim();
  }

  if (competitor.captain?.trim()) {
    return `Vedoucí: ${competitor.captain.trim()}`;
  }

  return competitor.country?.trim() || undefined;
}

export function formatPresence(value?: components["schemas"]["Presence"]) {
  switch (value) {
    case "0":
    case "Excused":
      return "Omluven";
    case "2":
    case "NoShow":
      return "Nenastoupil";
    case "3":
    case "WaitingList":
      return "Čekací listina";
    default:
      return undefined;
  }
}

export function formatCompletion(value?: string) {
  switch (value) {
    case "Retirement":
      return "Odstoupení";
    case "Disqualification":
      return "Diskvalifikace";
    default:
      return undefined;
  }
}
