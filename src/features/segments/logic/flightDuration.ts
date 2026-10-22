import type { Translate } from '../../../shared/i18n/translator'
import type { Segment } from '../types'

/**
 * Flyvetiden i minutter. Kan kun regnes ud, når begge lufthavnes forskel til UTC
 * kendes (fra flyopslaget) — de lokale tider alene giver ikke tidszonerne.
 */
export function flightDurationMinutes(
  segment: Pick<
    Segment,
    'departureTime' | 'arrivalTime' | 'departureUtcOffset' | 'arrivalUtcOffset'
  >,
): number | undefined {
  const { departureTime, arrivalTime, departureUtcOffset, arrivalUtcOffset } = segment
  if (!departureTime || !arrivalTime || !departureUtcOffset || !arrivalUtcOffset) return undefined
  const departs = Date.parse(`${departureTime}${departureUtcOffset}`)
  const arrives = Date.parse(`${arrivalTime}${arrivalUtcOffset}`)
  if (Number.isNaN(departs) || Number.isNaN(arrives) || arrives <= departs) return undefined
  return Math.round((arrives - departs) / 60_000)
}

/** 125 → "2 t 5 min", 120 → "2 t", 45 → "45 min". */
export function formatDuration(minutes: number, t: Translate): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return t('segments.durationMinutes', { m })
  if (m === 0) return t('segments.durationHours', { h })
  return t('segments.durationHoursMinutes', { h, m })
}

/** "flyvetid 2 t 5 min" — eller undefined, hvis flyvetiden ikke kendes. */
export function describeFlightDuration(
  segment: Parameters<typeof flightDurationMinutes>[0],
  t: Translate,
): string | undefined {
  const minutes = flightDurationMinutes(segment)
  return minutes === undefined
    ? undefined
    : t('segments.flightDuration', { duration: formatDuration(minutes, t) })
}
