/** Lægger `offsetDays` til en ISO-dato (YYYY-MM-DD) i UTC, så resultatet ikke
 * afhænger af browserens tidszone. */
export function addDaysToIsoDate(isoDate: string, offsetDays: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}
