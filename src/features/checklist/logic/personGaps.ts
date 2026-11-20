import type { TransportMode } from '../../segments/types'
import { resolveDeparture } from '../../segments/logic/tickets'
import { isTravelling } from '../../segments/logic/travelers'
import type { PersonGap } from '../types'
import { includesPerson, sleepsOnBoard, stayForNight, type GapInput } from './gapInput'
import { travelGaps } from './travelGaps'

/** Egen bil og gåture skal ikke bookes — de tæller ikke som "ikke bekræftet". */
const NO_BOOKING_MODES: TransportMode[] = ['bil', 'gang']

/** Nætter uden overnatning (og uden natfly/nattog). Den sidste dag har ingen nat. */
export function nightGaps(input: GapInput, uid: string): PersonGap[] {
  const { days, stays, entries } = input
  return days
    .slice(0, -1)
    .filter((day) => !stayForNight(stays, day.date, uid) && !sleepsOnBoard(entries, day.date, uid))
    .map((day) => ({
      kind: 'overnatning',
      key: `overnatning:${day.id}`,
      dayId: day.id,
      dayNumber: day.dayNumber,
      date: day.date,
    }))
}

/**
 * Dage uden en reservation af typen "Aktivitet" (restauranter tæller ikke).
 * Dage, hvor man flyver, springes over — de er rejsedage.
 */
export function activityGaps(input: GapInput, uid: string): PersonGap[] {
  const { days, reservations, entries } = input
  return days
    .filter(
      (day) =>
        !reservations.some(
          (reservation) =>
            reservation.kind === 'aktivitet' &&
            reservation.date === day.date &&
            includesPerson(reservation.travelerUids, uid),
        ),
    )
    .filter(
      (day) =>
        !entries.some(
          (entry) =>
            entry.segment.mode === 'fly' &&
            isTravelling(entry.segment, uid) &&
            resolveDeparture(entry).date === day.date,
        ),
    )
    .map((day) => ({
      kind: 'aktivitet',
      key: `aktivitet:${day.id}`,
      dayId: day.id,
      dayNumber: day.dayNumber,
      date: day.date,
    }))
}

/** Transport, der stadig står som "planlagt" — altså ikke bekræftet/booket. */
export function unconfirmedGaps(input: GapInput, uid: string): PersonGap[] {
  return input.entries
    .filter(
      (entry) =>
        entry.segment.status !== 'bekræftet' &&
        !NO_BOOKING_MODES.includes(entry.segment.mode) &&
        isTravelling(entry.segment, uid),
    )
    .map((entry) => ({
      kind: 'ubekraeftet',
      key: `ubekraeftet:${entry.segment.id}`,
      dayId: entry.dayId,
      dayNumber: entry.dayNumber,
      date: entry.dayDate,
      segment: entry.segment,
    }))
}

/** Alle huller for én person. */
export function personGaps(input: GapInput, uid: string): PersonGap[] {
  return [
    ...travelGaps(input, uid),
    ...nightGaps(input, uid),
    ...activityGaps(input, uid),
    ...unconfirmedGaps(input, uid),
  ]
}
