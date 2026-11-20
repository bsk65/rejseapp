import type { Place } from '../../shared/types/place'

/** Huller i "Mangler"-oversigten, man kan markere som OK på en dag (se features/checklist). */
export type DayCheckKind = 'rejse' | 'overnatning' | 'aktivitet'

export type Day = {
  id: string
  dayNumber: number
  date: string
  fromPlace?: Place
  toPlace?: Place
  note?: string
  /** Huller, der er markeret "Det er OK" på dagen, f.eks. en fridag uden aktivitet. */
  checksOk?: DayCheckKind[]
  /** Hvem der oprettede dagen — kun informativ, ikke sikkerhedsrelevant. */
  ownerUid: string
  /** Denormaliseret fra rejsens memberUids — se CLAUDE.md. */
  memberUids: string[]
}
