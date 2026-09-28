import { distanceMeters } from '../../../shared/utils/geo'
import type { LatLng } from '../../../shared/types/place'
import type { JourneyStop, StopKind } from '../types'
import { interpolateGreatCircle } from './greatCircle'

/** Hvor længe afspilningen holder pause ved et stop (ms ved normal hastighed). */
const HOLD_MS: Record<StopKind, number> = { foto: 2500, checkin: 1500, sted: 1000, spor: 0 }

/** Den samlede bevægelsestid holdes inden for disse grænser, uanset rejsens længde. */
const MIN_MOVE_MS = 15_000
const MAX_MOVE_MS = 90_000

export type TimelineEntry =
  | { kind: 'move'; from: number; to: number; start: number; end: number; km: number }
  | { kind: 'hold'; stop: number; start: number; end: number }

export type Timeline = {
  entries: TimelineEntry[]
  duration: number
  /** Tilbagelagt distance frem til hvert stop (km). */
  cumulativeKm: number[]
}

export type PlaybackState = {
  position: LatLng
  /** Det senest nåede stop. */
  stopIndex: number
  /** Tilbagelagt distance indtil nu (km). */
  km: number
  /** Længden af det stræk, der køres lige nu (0 under en pause) — styrer zoom. */
  legKm: number
  /** Hvor langt (0-1) det aktuelle stræk er kørt (0 under en pause). */
  legFraction: number
  /** Stoppet der holdes pause ved, ellers null. */
  holdingStop: number | null
}

/**
 * Tiden for et stræk vokser med logaritmen af længden: en flyrejse på 1000 km
 * må gerne tage længere end en gåtur på 1 km, men ikke 1000 gange så lang tid.
 */
function rawMoveMs(km: number): number {
  return 1000 * Math.log1p(km)
}

/** Lægger rejsens stop ud på en tidslinje: skiftevis bevægelse og pauser. */
export function buildTimeline(stops: JourneyStop[]): Timeline {
  const legKm = stops.slice(1).map((stop, i) => distanceMeters(stops[i], stop) / 1000)
  const cumulativeKm = [0]
  legKm.forEach((km) => cumulativeKm.push(cumulativeKm[cumulativeKm.length - 1] + km))

  const rawTotal = legKm.reduce((sum, km) => sum + rawMoveMs(km), 0)
  const scale =
    rawTotal === 0 ? 1 : Math.min(MAX_MOVE_MS, Math.max(MIN_MOVE_MS, rawTotal)) / rawTotal

  const entries: TimelineEntry[] = []
  let now = 0
  stops.forEach((stop, i) => {
    const hold = HOLD_MS[stop.kind]
    if (hold > 0) {
      entries.push({ kind: 'hold', stop: i, start: now, end: now + hold })
      now += hold
    }
    if (i < legKm.length) {
      const ms = rawMoveMs(legKm[i]) * scale
      if (ms > 0) {
        entries.push({ kind: 'move', from: i, to: i + 1, start: now, end: now + ms, km: legKm[i] })
        now += ms
      }
    }
  })

  return { entries, duration: now, cumulativeKm }
}

/** Finder det tidslinje-element, der er i gang til tiden `elapsed` (binær søgning). */
function entryAt(entries: TimelineEntry[], elapsed: number): TimelineEntry | undefined {
  let low = 0
  let high = entries.length - 1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (elapsed < entries[mid].start) high = mid - 1
    else if (elapsed >= entries[mid].end) low = mid + 1
    else return entries[mid]
  }
  return undefined
}

/** Hvor afspilningen er til tiden `elapsed` (ms). Kræver mindst ét stop. */
export function stateAt(stops: JourneyStop[], timeline: Timeline, elapsed: number): PlaybackState {
  const entry = entryAt(timeline.entries, elapsed)
  const last = stops.length - 1

  if (!entry) {
    const index = elapsed <= 0 ? 0 : last
    return {
      position: stops[index],
      stopIndex: index,
      km: timeline.cumulativeKm[index],
      legKm: 0,
      legFraction: 0,
      holdingStop: null,
    }
  }

  if (entry.kind === 'hold') {
    return {
      position: stops[entry.stop],
      stopIndex: entry.stop,
      km: timeline.cumulativeKm[entry.stop],
      legKm: 0,
      legFraction: 0,
      holdingStop: entry.stop,
    }
  }

  const fraction = (elapsed - entry.start) / (entry.end - entry.start)
  return {
    position: interpolateGreatCircle(stops[entry.from], stops[entry.to], fraction),
    stopIndex: entry.from,
    km: timeline.cumulativeKm[entry.from] + entry.km * fraction,
    legKm: entry.km,
    legFraction: fraction,
    holdingStop: null,
  }
}

/**
 * Zoomniveau hvor et stræk af `km` fylder omtrent halvdelen af en
 * telefonskærm: langt ude over en flyrejse, tæt på under en gåtur.
 */
export function zoomForLegKm(km: number): number {
  const zoom = Math.log2(31_000 / Math.max(km, 0.01))
  return Math.min(15, Math.max(2, zoom))
}
