import type { TextKey } from '../../shared/i18n/translator'
import type { Place } from '../../shared/types/place'
import type { Price } from '../../shared/types/price'

export type ReservationKind = 'restaurant' | 'aktivitet' | 'andet'

/**
 * En anden reservation end transport og overnatning — middag, udflugt,
 * dykning, museum … Ligger på rejsen med en dato (som overnatninger), så den
 * altid vises på den rigtige dag.
 */
export type Reservation = {
  id: string
  kind: ReservationKind
  name: string
  place?: Place
  /** YYYY-MM-DD */
  date: string
  /** HH:mm */
  time?: string
  bookingRef?: string
  phone?: string
  note?: string
  /** Hvad reservationen kostede (i alt). */
  price?: Price
  /** Hvem der oprettede reservationen — kun informativ, ikke sikkerhedsrelevant. */
  ownerUid: string
  /** Denormaliseret fra rejsens memberUids — se CLAUDE.md. */
  memberUids: string[]
}

/** Felter en bruger kan redigere i formularen. */
export type ReservationDetails = Omit<Reservation, 'id' | 'ownerUid' | 'memberUids'>

export const RESERVATION_KINDS: ReservationKind[] = ['restaurant', 'aktivitet', 'andet']

export const reservationKindLabel: Record<ReservationKind, TextKey> = {
  restaurant: 'reservations.kindRestaurant',
  aktivitet: 'reservations.kindActivity',
  andet: 'reservations.kindOther',
}

export const reservationKindIcon: Record<ReservationKind, string> = {
  restaurant: '🍽️',
  aktivitet: '🎟️',
  andet: '📌',
}
