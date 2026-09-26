import type { Place } from '../../shared/types/place'

export type Day = {
  id: string
  dayNumber: number
  date: string
  fromPlace?: Place
  toPlace?: Place
  note?: string
  ownerUid: string
}
