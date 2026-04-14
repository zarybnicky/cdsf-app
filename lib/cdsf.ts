import type { components } from "@/CDSF";

type Athlete = components["schemas"]["Athlete"];

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

export function parseCdsfDate(input: string) {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDateMs(input: string) {
  return parseCdsfDate(input)?.getTime() ?? Number.NEGATIVE_INFINITY;
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

export function formatSimpleDateTime(input?: string) {
  if (!input) {
    return undefined;
  }

  const date = parseCdsfDate(input);

  if (!date) {
    return input;
  }

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()} ${hours}:${minutes}`;
}

export function getAgeLabel(age: Athlete["age"]) {
  return translatedAgeLabels[age] ?? age;
}
