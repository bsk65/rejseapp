import { computeEndDate } from './tripDates'

type DatedTrip = { startDate: string; days: number }

/** En rejse er overstået, når dens sidste dag ligger før i dag (ISO-datoer, YYYY-MM-DD). */
export function isTripOver(trip: DatedTrip, today: string): boolean {
  return computeEndDate(trip.startDate, trip.days) < today
}

/**
 * Deler rejserne i aktuelle (i gang eller kommende — den nærmeste først) og
 * arkiverede (overståede — den seneste først).
 */
export function splitTripsByArchive<T extends DatedTrip>(
  trips: T[],
  today: string,
): { current: T[]; archived: T[] } {
  const byStart = (a: T, b: T) => a.startDate.localeCompare(b.startDate)
  const current = trips.filter((trip) => !isTripOver(trip, today)).sort(byStart)
  const archived = trips.filter((trip) => isTripOver(trip, today)).sort((a, b) => byStart(b, a))
  return { current, archived }
}
