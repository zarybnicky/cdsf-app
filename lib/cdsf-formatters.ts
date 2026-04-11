import type { components } from '@/CDSF';

const weekdayLabels = ['NE', 'PO', 'UT', 'ST', 'CT', 'PA', 'SO'];
const monthLabels = ['LED', 'UNO', 'BRE', 'DUB', 'KVE', 'CER', 'CVC', 'SRP', 'ZAR', 'RIJ', 'LIS', 'PRO'];

type Notification = components['schemas']['Notification'];
type EventRegistration = components['schemas']['EventRegistration'];
type CompetitionRegistration = components['schemas']['CompetitionRegistration'];
type Athlete = components['schemas']['Athlete'];

const translatedAgeLabels: Partial<Record<Athlete['age'], string>> = {
  'Under 8': 'Do 8 let',
  'Juvenile I': 'Deti I',
  'Juvenile II': 'Deti II',
  Juvenile: 'Deti',
  'Junior I': 'Juniori I',
  'Junior II': 'Juniori II',
  Junior: 'Juniori',
  Youth: 'Mladez',
  Adult: 'Dospeli',
  'Under 21': 'Do 21 let',
  Senior: 'Seniori',
  'Senior I': 'Seniori I',
  'Senior II': 'Seniori II',
  'Senior III': 'Seniori III',
  'Senior IV': 'Seniori IV',
  'Senior V': 'Seniori V',
};

function parseDate(input: string) {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim();
}

function formatAgeLabel(age: CompetitionRegistration['age']) {
  return age;
}

function formatDisciplineLabel(discipline: CompetitionRegistration['discipline']) {
  switch (discipline) {
    case 'TenDances':
      return '10 Dances';
    case 'Standard+Latin':
      return 'Std + Lat';
    case 'SingleOfTenDances':
      return 'Single 10D';
    case 'FreeStyle':
      return 'Freestyle';
    default:
      return discipline;
  }
}

function formatPlacement(ranking?: number, rankingTo?: number) {
  if (typeof ranking !== 'number') {
    return undefined;
  }

  if (typeof rankingTo === 'number' && rankingTo > ranking) {
    return `${ranking}-${rankingTo}. place`;
  }

  return `${ranking}. place`;
}

export function formatNotificationTimestamp(createdAt: string) {
  const date = parseDate(createdAt);

  if (!date) {
    return createdAt;
  }

  return `/ ${weekdayLabels[date.getDay()]} ${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()} / ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
    sections.push(`Kontakt: [${notification.contact.trim()}](mailto:${notification.contact.trim()})`);
  }

  if (notification.link?.trim()) {
    sections.push(`[Otevrit odkaz](${notification.link.trim()})`);
  }

  return {
    id: notification.id.toString(),
    title: stripInlineMarkdown(notification.caption),
    publishedAt: formatNotificationTimestamp(notification.created),
    markdown: sections.join('\n\n') || stripInlineMarkdown(notification.caption),
  };
}

export function formatCompetitionBadge(dateString: string) {
  const date = parseDate(dateString);

  if (!date) {
    return {
      dateDay: '--',
      dateMonth: '---',
    };
  }

  return {
    dateDay: pad(date.getDate()),
    dateMonth: monthLabels[date.getMonth()],
  };
}

export function formatSimpleDate(input?: string) {
  if (!input) {
    return undefined;
  }

  const date = parseDate(input);

  if (!date) {
    return input;
  }

  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}

export function formatTranslatedAge(age: Athlete['age']) {
  return translatedAgeLabels[age] ?? age;
}

export function eventRegistrationToCompetitionCard(
  event: EventRegistration,
  variant: 'registered' | 'results',
) {
  const details = event.competitions.map((competition) => {
    const base = `${formatAgeLabel(competition.age)} ${formatDisciplineLabel(competition.discipline)}`;

    if (variant === 'results') {
      const placement = formatPlacement(competition.ranking, competition.rankingTo);

      if (placement) {
        return `${base} ${placement}`;
      }
    }

    if (competition.class) {
      return `${base} ${competition.class}`;
    }

    return base;
  });

  return {
    id: event.eventId?.toString() ?? `${event.eventName}-${event.date}`,
    city: event.city,
    title: event.eventName,
    details,
    ...formatCompetitionBadge(event.date),
  };
}
