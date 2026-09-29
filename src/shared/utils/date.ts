/** Lægger `offsetDays` til en ISO-dato (YYYY-MM-DD) i UTC, så resultatet ikke
 * afhænger af browserens tidszone. */
export function addDaysToIsoDate(isoDate: string, offsetDays: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

/** "lør. 4. okt." (eller "Sat 4 Oct" med locale en-GB) for en ISO-dato (YYYY-MM-DD), uafhængigt af browserens tidszone. */
export function formatDayDate(isoDate: string, locale = 'da-DK'): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

/** Lokal kalenderdato (YYYY-MM-DD) for et tidspunkt — rejsens dage er lokale datoer. */
export function localIsoDate(time: number): string {
  const d = new Date(time)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Klokkeslættet (HH:mm) i et tidspunkt — fuld dato+tid ("2026-09-29T17:10") eller kun tid. */
export function clockTime(value: string | undefined): string | undefined {
  return value?.match(/(\d{2}:\d{2})/)?.[1]
}
