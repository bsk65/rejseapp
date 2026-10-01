import type { Place } from '../../../shared/types/place'
import { clockTime } from '../../../shared/utils/date'
import type { TransportMode } from '../types'
import type { TicketEntry } from './tickets'

/** Én tur med både Fra og Til — kan tegnes på kortet og bruges i afspilningen. */
export type Leg = {
  dayId: string
  dayNumber: number
  mode: TransportMode
  from: Place
  to: Place
}

/**
 * Rejsens ture (transport med både Fra og Til), dag for dag. Inden for en dag
 * sorteres efter afgangstid, hvis alle dagens ture har en — ellers beholdes
 * rækkefølgen, de blev oprettet i.
 */
export function buildLegs(entries: TicketEntry[]): Leg[] {
  const byDay = new Map<string, TicketEntry[]>()
  entries.forEach((entry) => {
    const { departurePlace, arrivalPlace } = entry.segment
    if (!departurePlace || !arrivalPlace) return
    byDay.set(entry.dayId, [...(byDay.get(entry.dayId) ?? []), entry])
  })

  return [...byDay.values()]
    .sort((a, b) => a[0].dayNumber - b[0].dayNumber)
    .flatMap((dayEntries) => {
      const clocks = dayEntries.map((entry) => clockTime(entry.segment.departureTime))
      const ordered = clocks.every(Boolean)
        ? dayEntries
            .map((entry, i) => ({ entry, clock: clocks[i] as string }))
            .sort((a, b) => a.clock.localeCompare(b.clock))
            .map(({ entry }) => entry)
        : dayEntries
      return ordered.map(({ segment, dayId, dayNumber }): Leg => ({
        dayId,
        dayNumber,
        mode: segment.mode,
        from: segment.departurePlace as Place,
        to: segment.arrivalPlace as Place,
      }))
    })
}

function samePlace(a: Place, b: Place): boolean {
  return a.placeId === b.placeId || (a.lat === b.lat && a.lng === b.lng)
}

/**
 * Dagens rute som en række steder: dagens Fra, alle turenes Fra/Til i
 * rækkefølge og dagens Til — uden at samme sted gentages lige efter sig selv.
 */
export function dayRoute(
  fromPlace: Place | undefined,
  legs: Leg[],
  toPlace: Place | undefined,
): Place[] {
  const places = [fromPlace, ...legs.flatMap((leg) => [leg.from, leg.to]), toPlace].filter(
    (place): place is Place => place !== undefined,
  )
  return places.filter((place, i) => i === 0 || !samePlace(place, places[i - 1]))
}
