import type { Place } from '../../shared/types/place'

export type Day = {
  id: string
  dayNumber: number
  date: string
  fromPlace?: Place
  toPlace?: Place
  note?: string
  /**
   * Huller i "Mangler", der er markeret "Det er OK" på dagen: "overnatning",
   * "aktivitet" eller "rejse:<fra>><til>" for én bestemt manglende tur (se okKeyOf
   * i features/checklist). Et gammelt rent "rejse" ignoreres.
   */
  checksOk?: string[]
  /** Hvem der oprettede dagen — kun informativ, ikke sikkerhedsrelevant. */
  ownerUid: string
  /** Denormaliseret fra rejsens memberUids — se CLAUDE.md. */
  memberUids: string[]
}
