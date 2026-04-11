export function parseCdsfDate(input: string) {
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getCdsfTimestamp(input: string) {
  return parseCdsfDate(input)?.getTime() ?? Number.NEGATIVE_INFINITY;
}
