import type { Place } from '../../shared/types/place'

export type Day = {
  id: string
  dayNumber: number
  date: string
  fromPlace?: Place
  toPlace?: Place
  note?: string
  /** Hvem der oprettede dagen — kun informativ, ikke sikkerhedsrelevant. */
  ownerUid: string
  /** Denormaliseret fra rejsens memberUids — se CLAUDE.md. */
  memberUids: string[]
}
