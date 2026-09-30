import { addDaysToIsoDate } from '../../../shared/utils/date'

/** Øvre grænse for en rejses længde — dage oprettes i én Firestore-batch (maks. 500 skrivninger). */
export const MAX_TRIP_DAYS = 365

export function computeEndDate(startDate: string, days: number): string {
  return addDaysToIsoDate(startDate, Math.max(days - 1, 0))
}

export function formatDateRange(startDate: string, days: number): string {
  const end = computeEndDate(startDate, days)
  if (end === startDate) {
    return startDate
  }
  return `${startDate} – ${end}`
}

/**
 * Antal rejsedage fra start til slut, begge dage inklusive ("3.-6. okt." = 4
 * dage). Returnerer undefined, hvis en dato mangler, eller slut ligger før start.
 */
export function countTripDays(startDate: string, endDate: string): number | undefined {
  if (!startDate || !endDate) return undefined
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return undefined
  return Math.round((end - start) / 86_400_000) + 1
}

/** Læser "Antal dage"-feltet: et helt tal fra 1 og op, ellers undefined. */
export function parseDayCount(text: string): number | undefined {
  if (!/^\d+$/.test(text.trim())) return undefined
  const value = Number(text)
  return value >= 1 ? value : undefined
}
