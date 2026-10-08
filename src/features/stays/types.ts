import type { Place } from '../../shared/types/place'
import type { Price } from '../../shared/types/price'

/** En overnatning (hotel, Airbnb …) — strækker sig over en eller flere nætter. */
export type Stay = {
  id: string
  name: string
  /** Adressen, søgt op som andre steder — bruges til kortet. */
  place?: Place
  /** YYYY-MM-DD */
  checkInDate: string
  /** HH:mm — tidligst indtjekning */
  checkInTime?: string
  /** YYYY-MM-DD — altid efter checkInDate */
  checkOutDate: string
  /** HH:mm — senest udtjekning */
  checkOutTime?: string
  bookingRef?: string
  /** Dørkode, nøgleboks o.l. */
  accessCode?: string
  wifi?: string
  hostPhone?: string
  note?: string
  /** Hvad overnatningen kostede i alt (alle nætter). */
  price?: Price
  /** Hvem der oprettede overnatningen — kun informativ, ikke sikkerhedsrelevant. */
  ownerUid: string
  /** Denormaliseret fra rejsens memberUids — se CLAUDE.md. */
  memberUids: string[]
}

/** Felter en bruger kan redigere i formularen. */
export type StayDetails = Omit<Stay, 'id' | 'ownerUid' | 'memberUids'>
