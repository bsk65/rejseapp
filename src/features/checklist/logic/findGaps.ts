import type { Day } from '../../days/types'
import { GAP_KINDS, isOkKind, type Gap, type GapKind } from '../types'
import type { GapInput } from './gapInput'
import { personGaps } from './personGaps'

/**
 * Hullerne for alle rejsende, lagt sammen: et hul, flere har, står der én
 * gang med alle personerne i `people`. Sorteret efter dag, i rækkefølgen de
 * blev fundet inden for dagen.
 */
export function findGaps(input: GapInput, travelerUids: string[]): Gap[] {
  const byKey = new Map<string, Gap>()
  travelerUids.forEach((uid) =>
    personGaps(input, uid).forEach((gap) => {
      const existing = byKey.get(gap.key)
      if (existing) existing.people.push(uid)
      else byKey.set(gap.key, { ...gap, people: [uid] })
    }),
  )
  return [...byKey.values()].sort((a, b) => a.dayNumber - b.dayNumber)
}

/** Er hullet markeret "Det er OK" på sin dag? */
export function isMarkedOk(gap: Gap, days: Day[]): boolean {
  if (!isOkKind(gap.kind)) return false
  const kind = gap.kind
  return days.some((day) => day.id === gap.dayId && (day.checksOk ?? []).includes(kind))
}

export type GapGroup = { kind: GapKind; open: Gap[]; ok: Gap[] }

/** Hullerne delt op pr. slags, og i dem, der mangler, og dem, der er markeret OK. */
export function groupGaps(gaps: Gap[], days: Day[]): GapGroup[] {
  return GAP_KINDS.map((kind) => {
    const ofKind = gaps.filter((gap) => gap.kind === kind)
    return {
      kind,
      open: ofKind.filter((gap) => !isMarkedOk(gap, days)),
      ok: ofKind.filter((gap) => isMarkedOk(gap, days)),
    }
  })
}

/** Antal huller, der stadig mangler (til knappen). */
export function openGapCount(groups: GapGroup[]): number {
  return groups.reduce((sum, group) => sum + group.open.length, 0)
}

/** Gælder hullet ikke alle rejsende, vises det, hvem det gælder for. */
export function concernsEveryone(gap: Gap, travelerUids: string[]): boolean {
  return travelerUids.every((uid) => gap.people.includes(uid))
}
