import { clockTime } from '../../../shared/utils/date'
import type { Segment } from '../types'

/**
 * Dagens segmenter i den rækkefølge, de afgår: dem med afgangstid sorteret
 * efter klokkeslæt, dem uden bagefter i den rækkefølge, de blev oprettet.
 */
export function sortByDeparture(segments: Segment[]): Segment[] {
  const timed = segments
    .map((segment) => ({ segment, clock: clockTime(segment.departureTime) }))
    .filter((entry): entry is { segment: Segment; clock: string } => Boolean(entry.clock))
    .sort((a, b) => a.clock.localeCompare(b.clock))
    .map(({ segment }) => segment)
  const untimed = segments.filter((segment) => !clockTime(segment.departureTime))
  return [...timed, ...untimed]
}
