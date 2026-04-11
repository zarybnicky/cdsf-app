import type { components } from "@/CDSF";
import { parseCdsfDate } from "@/lib/cdsf-dates";

const weekdayLabels = ["NE", "PO", "ÚT", "ST", "ČT", "PÁ", "SO"];
const monthLabels = [
  "LED",
  "UNO",
  "BŘE",
  "DUB",
  "KVĚ",
  "ČER",
  "ČVC",
  "SRP",
  "ZÁŘ",
  "ŘÍJ",
  "LIS",
  "PRO",
];

type Notification = components["schemas"]["Notification"];
type EventRegistration = components["schemas"]["EventRegistration"];
type CompetitionRegistration = components["schemas"]["CompetitionRegistration"];
type Athlete = components["schemas"]["Athlete"];
type RuntimeCompetitionRegistration = CompetitionRegistration & {
  competitorsCount?: number;
  fromClass?: CompetitionRegistration["class"];
};

const translatedAgeLabels: Partial<Record<Athlete["age"], string>> = {
  "Under 8": "Do 8 let",
  "Juvenile I": "Děti I",
  "Juvenile II": "Děti II",
  Juvenile: "Děti",
  "Junior I": "Juniori I",
  "Junior II": "Juniori II",
  Junior: "Juniori",
  Youth: "Mládež",
  Adult: "Dospělí",
  "Under 21": "Do 21 let",
  Senior: "Seniori",
  "Senior I": "Seniori I",
  "Senior II": "Seniori II",
  "Senior III": "Seniori III",
  "Senior IV": "Seniori IV",
  "Senior V": "Seniori V",
};

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function formatDisciplineLabel(
  discipline: CompetitionRegistration["discipline"],
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

function formatCompetitionClassLabel(
  competition: RuntimeCompetitionRegistration,
) {
  const classLabel = competition.class;

  if (
    !classLabel ||
    classLabel === "Open" ||
    classLabel === ("Unknown" as CompetitionRegistration["class"])
  ) {
    return undefined;
  }

  return classLabel;
}

function formatCompetitionGradePrefix(
  grade?: CompetitionRegistration["grade"],
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

function formatPlacement(
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

export function formatNotificationTimestamp(createdAt: string) {
  const date = parseCdsfDate(createdAt);

  if (!date) {
    return createdAt;
  }

  return `${weekdayLabels[date.getDay()]} ${date.getDate()}.\u2009${date.getMonth() + 1}.\u2009${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function notificationToAnnouncementCard(notification: Notification) {
  const sections: string[] = [];

  if (notification.message?.trim()) {
    sections.push(notification.message.trim());
  }

  if (notification.author?.trim()) {
    sections.push(`Autor: **${notification.author.trim()}**`);
  }

  if (notification.contact?.trim()) {
    sections.push(
      `Kontakt: [${notification.contact.trim()}](mailto:${notification.contact.trim()})`,
    );
  }

  if (notification.link?.trim()) {
    sections.push(`[Otevřít odkaz](${notification.link.trim()})`);
  }

  return {
    id: notification.id.toString(),
    title: stripInlineMarkdown(notification.caption),
    publishedAt: formatNotificationTimestamp(notification.created),
    markdown:
      sections.join("\n\n") || stripInlineMarkdown(notification.caption),
  };
}

export function formatCompetitionBadge(dateString: string) {
  const date = parseCdsfDate(dateString);

  if (!date) {
    return {
      dateDay: "--",
      dateMonth: "---",
      dateYear: "----",
    };
  }

  return {
    dateDay: pad(date.getDate()),
    dateMonth: monthLabels[date.getMonth()],
    dateYear: date.getFullYear().toString(),
  };
}

export function formatSimpleDate(input?: string) {
  if (!input) {
    return undefined;
  }

  const date = parseCdsfDate(input);

  if (!date) {
    return input;
  }

  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}

export function formatTranslatedAge(age: Athlete["age"]) {
  return translatedAgeLabels[age] ?? age;
}

export function eventRegistrationToCompetitionCard(
  event: EventRegistration,
  variant: "registered" | "results",
) {
  const details = event.competitions.map((competition) => {
    const runtimeCompetition = competition as RuntimeCompetitionRegistration;
    const classLabel = formatCompetitionClassLabel(runtimeCompetition);
    const gradePrefix = formatCompetitionGradePrefix(competition.grade);
    const base = [
      gradePrefix,
      formatTranslatedAge(competition.age),
      classLabel,
      formatDisciplineLabel(competition.discipline),
    ]
      .filter(Boolean)
      .join(" ");

    if (variant === "results") {
      const placement = formatPlacement(
        competition.ranking,
        competition.rankingTo,
        runtimeCompetition.competitorsCount,
      );

      if (placement) {
        return {
          label: base,
          value: placement,
        };
      }
    }

    return {
      label: base,
    };
  });

  return {
    id: event.eventId?.toString() ?? `${event.eventName}-${event.date}`,
    city: event.city,
    title: event.eventName,
    details,
    ...formatCompetitionBadge(event.date),
  };
}
