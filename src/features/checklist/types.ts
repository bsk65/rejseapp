import type { TextKey } from '../../shared/i18n/translator'
import type { Place } from '../../shared/types/place'
import type { DayCheckKind } from '../days/types'
import type { Segment } from '../segments/types'

/** De slags huller, "Mangler"-oversigten finder. */
export type GapKind = 'rejse' | 'overnatning' | 'aktivitet' | 'ubekraeftet'

/** Huller, man selv kan markere som "Det er OK" på en dag (ubekræftet transport rettes i stedet). */
export type OkKind = DayCheckKind

export const GAP_KINDS: GapKind[] = ['rejse', 'overnatning', 'aktivitet', 'ubekraeftet']
export const OK_KINDS: OkKind[] = ['rejse', 'overnatning', 'aktivitet']

export function isOkKind(kind: GapKind): kind is OkKind {
  return kind !== 'ubekraeftet'
}

/** Et rejse-hul: udrejsen eller hjemrejsen mangler, eller man kommer ikke fra et sted til det næste. */
export type TravelGapReason = 'udrejse' | 'hjemrejse' | 'mellem'

/**
 * Et sted på ruten. En overnatning uden adresse har intet `place` — så kendes
 * kun navnet, og den regnes for langt fra alle andre steder.
 */
export type GapPlace = { key: string; name: string; place?: Place }

/** Ét hul for én person, før hullerne for alle rejsende lægges sammen. */
export type PersonGap = {
  kind: GapKind
  /** Ens for samme hul hos flere personer — bruges til at lægge dem sammen. */
  key: string
  dayId: string
  dayNumber: number
  date: string
  /** Kun rejse-huller. */
  reason?: TravelGapReason
  from?: GapPlace
  to?: GapPlace
  /** Kun ubekræftet transport. */
  segment?: Segment
}

/** Et hul og hvem det gælder for. */
export type Gap = PersonGap & { people: string[] }

export const gapKindLabel: Record<GapKind, TextKey> = {
  rejse: 'checklist.kindTravel',
  overnatning: 'checklist.kindStay',
  aktivitet: 'checklist.kindActivity',
  ubekraeftet: 'checklist.kindUnconfirmed',
}

export const gapKindIcon: Record<GapKind, string> = {
  rejse: '🚆',
  overnatning: '🛏️',
  aktivitet: '🎟️',
  ubekraeftet: '📝',
}
