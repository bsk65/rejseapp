import { clockTime } from '../../../shared/utils/date'
import { transportModeLabel, type Segment } from '../types'

/** Teksten på et transportkort under en dag: overskrift + én linje detaljer. */
export type SegmentCardText = { title: string; detail: string }

export function describeSegment(segment: Segment): SegmentCardText {
  const label = transportModeLabel[segment.mode]
  const title = [segment.carrier?.trim(), segment.number].filter(Boolean).join(' ') || label

  const from = segment.departurePlace?.name
  const to = segment.arrivalPlace?.name
  const departs = clockTime(segment.departureTime)
  const arrives = clockTime(segment.arrivalTime)
  const parts = [
    from || to ? `${from ?? '?'} → ${to ?? '?'}` : undefined,
    departs && `afgang ${departs}`,
    arrives && `ankomst ${arrives}`,
  ].filter(Boolean)

  if (parts.length > 0) return { title, detail: parts.join(' · ') }
  return { title, detail: segment.freeText || 'Mangler detaljer — tryk for at udfylde' }
}
