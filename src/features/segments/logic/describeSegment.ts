import type { Translate } from '../../../shared/i18n/translator'
import { clockTime } from '../../../shared/utils/date'
import { transportModeLabel, type Segment } from '../types'

/** Teksten på et transportkort under en dag: overskrift + én linje detaljer. */
export type SegmentCardText = { title: string; detail: string }

export function describeSegment(segment: Segment, t: Translate): SegmentCardText {
  const label = t(transportModeLabel[segment.mode])
  const title = [segment.carrier?.trim(), segment.number].filter(Boolean).join(' ') || label

  const from = segment.departurePlace?.name
  const to = segment.arrivalPlace?.name
  const departs = clockTime(segment.departureTime)
  const arrives = clockTime(segment.arrivalTime)
  const parts = [
    from || to ? `${from ?? '?'} → ${to ?? '?'}` : undefined,
    departs && t('segments.departsAt', { time: departs }),
    arrives && t('segments.arrivesAt', { time: arrives }),
  ].filter(Boolean)

  if (parts.length > 0) return { title, detail: parts.join(' · ') }
  return { title, detail: segment.freeText || t('segments.missingDetails') }
}
