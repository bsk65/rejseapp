import type { Timestamp } from 'firebase/firestore'
import type { Place } from '../../shared/types/place'

export type TripStatus = 'planlagt' | 'i gang' | 'afsluttet'

export type SharedCategories = {
  photos: boolean
  track: boolean
}

export type Trip = {
  id: string
  title: string
  startDate: string
  days: number
  destinations: Place[]
  ownerUid: string
  memberUids: string[]
  /**
   * Medlemmer, der kun kigger med (følger rejsen, men rejser ikke selv med) —
   * altid en delmængde af memberUids. De er ikke med i "Hvem er med?" og
   * tælles ikke med i rejsens pris.
   */
  guestUids: string[]
  sharedCategories: SharedCategories
  status: TripStatus
  createdAt: Timestamp | null
}

export type NewTripInput = {
  title: string
  startDate: string
  days: number
  destinations: Place[]
}
