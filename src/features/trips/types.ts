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
