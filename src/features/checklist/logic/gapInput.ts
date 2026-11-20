import { clockTime } from '../../../shared/utils/date'
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

/** Sover personen i et fly/tog, der kører natten efter `date`? */
export function sleepsOnBoard(entries: TicketEntry[], date: string, uid: string): boolean {
  return entries.some(
    (entry) =>
      isTravelling(entry.segment, uid) &&
      resolveDeparture(entry).date === date &&
      isOvernight(entry),
  )
}
