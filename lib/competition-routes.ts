export const competitionTabs = {
  registered: {
    href: "/competitions/registered",
    label: "Přihlášky",
  },
  results: {
    href: "/competitions/results",
    label: "Výsledky",
  },
} as const;

export type CompetitionTab = keyof typeof competitionTabs;

export function getRouteId(
  value: string | string[] | undefined,
): number | null {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
