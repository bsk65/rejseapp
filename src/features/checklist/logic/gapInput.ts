import { addDaysToIsoDate, clockTime } from '../../../shared/utils/date'
import type { Day } from '../../days/types'
import type { Reservation } from '../../reservations/types'
import {
  compareCodePoints,
  resolveDeparture,
  ticketSortKey,
  type TicketEntry,
} from '../../segments/logic/tickets'
import { isTravelling } from '../../segments/logic/travelers'
import type { Stay } from '../../stays/types'

/** Det, "Mangler"-oversigten regner på. Dagene skal være sorteret efter dagnummer. */
export type GapInput = {
  days: Day[]
  entries: TicketEntry[]
  stays: Stay[]
  reservations: Reservation[]
}

/** Overnatninger og reservationer uden "Hvem er med?" gælder alle rejsens medlemmer. */
export function includesPerson(travelerUids: string[] | undefined, uid: string): boolean {
  return !travelerUids || travelerUids.length === 0 || travelerUids.includes(uid)
}

/** Personens transport på én dag i tidsorden (uden klokkeslæt sidst, som i "Billetter & tider"). */
export function personLegsOnDay(entries: TicketEntry[], dayId: string, uid: string): TicketEntry[] {
  return entries
    .filter((entry) => entry.dayId === dayId && isTravelling(entry.segment, uid))
    .map((entry) => ({ entry, key: ticketSortKey({ ...entry, ...resolveDeparture(entry) }) }))
    .sort((a, b) => compareCodePoints(a.key, b.key))
    .map(({ entry }) => entry)
}

/** Ankommer transporten først en senere dato (natfly, nattog)? Så sover man om bord. */
export function isOvernight(entry: TicketEntry): boolean {
  const departure = resolveDeparture(entry)
  const arrival = entry.segment.arrivalTime
  const arrivalDate = arrival?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1]
  if (arrivalDate) return arrivalDate > departure.date
  const arrivalClock = clockTime(arrival)
  return Boolean(arrivalClock && departure.time && arrivalClock < departure.time)
}

/** Den overnatning, personen har natten efter `date`. */
export function stayForNight(stays: Stay[], date: string, uid: string): Stay | undefined {
  return stays.find(
    (stay) =>
      includesPerson(stay.travelerUids, uid) &&
      stay.checkInDate <= date &&
      date < stay.checkOutDate,
  )
}

/**
 * Ankomsttidspunktet (YYYY-MM-DDTHH:mm, lokal tid på ankomststedet). Er kun
 * klokkeslættet kendt, er det afgangsdagen — eller dagen efter, hvis det er før afgang.
 */
export function arrivalAt(entry: TicketEntry): string | undefined {
  const raw = entry.segment.arrivalTime
  const full = raw?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (full) return `${full[1]}T${full[2]}`
  const clock = clockTime(raw)
  const departure = resolveDeparture(entry)
  if (!clock || !departure.time) return undefined
  const date = clock < departure.time ? addDaysToIsoDate(departure.date, 1) : departure.date
  return `${date}T${clock}`
}

/** Højst så lang tid mellem ankomst og næste afgang hen over natten, før man skal have et sted at sove. */
export const MAX_NIGHT_LAYOVER_HOURS = 8

function minutesBetween(from: string, to: string): number {
  return (Date.parse(`${to}:00Z`) - Date.parse(`${from}:00Z`)) / 60_000
}

/**
 * Er personen undervejs natten efter `date`? Enten om bord på et natfly/nattog,
 * eller med et kort skift hen over midnat (lander kl. 23, flyver videre kl. 02.20).
 */
export function nightInTransit(entries: TicketEntry[], date: string, uid: string): boolean {
  const own = entries.filter((entry) => isTravelling(entry.segment, uid))
  if (own.some((entry) => resolveDeparture(entry).date === date && isOvernight(entry))) return true

  const arrivals = own.map(arrivalAt).filter((at): at is string => !!at && at.slice(0, 10) <= date)
  const departures = own
    .map((entry) => resolveDeparture(entry).departsAt)
    .filter((at): at is string => !!at && at.slice(0, 10) > date)
  return arrivals.some((arrived) =>
    departures.some((departs) => {
      const wait = minutesBetween(arrived, departs)
      return wait >= 0 && wait <= MAX_NIGHT_LAYOVER_HOURS * 60
    }),
  )
}
