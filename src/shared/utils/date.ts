/** Lægger `offsetDays` til en ISO-dato (YYYY-MM-DD) i UTC, så resultatet ikke
 * afhænger af browserens tidszone. */
export function addDaysToIsoDate(isoDate: string, offsetDays: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

/** "lør. 4. okt." for en ISO-dato (YYYY-MM-DD), uafhængigt af browserens tidszone. */
export function formatDayDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('da-DK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}
