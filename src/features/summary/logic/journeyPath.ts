import { distanceMeters } from '../../../shared/utils/geo'
import type { LatLng } from '../../../shared/types/place'
import type { JourneyStop } from '../types'
import { interpolateGreatCircle, unwrapLng } from './greatCircle'
import type { PlaybackState } from './timeline'

/** Lange stræk (fly) deles op i stykker af højst så mange km, så buen tegnes pænt. */
const MAX_STEP_KM = 100

export type JourneyPath = {
  /** Hele ruten som linjepunkter, med buer på lange stræk og "udfoldede" længdegrader. */
  points: LatLng[]
  /** Indeks i `points` for hvert stop. */
  stopPointIndex: number[]
}

/** Hele ruten som linje — stop for stop, med storcirkel-buer på lange stræk. */
export function buildJourneyPath(stops: JourneyStop[]): JourneyPath {
  const points: LatLng[] = []
  const stopPointIndex: number[] = []

  stops.forEach((stop, i) => {
    if (i > 0) {
      const previous = stops[i - 1]
      const steps = Math.ceil(distanceMeters(previous, stop) / 1000 / MAX_STEP_KM)
      for (let k = 1; k < steps; k++) {
        const between = interpolateGreatCircle(previous, stop, k / steps)
        points.push({
          lat: between.lat,
          lng: unwrapLng(points[points.length - 1].lng, between.lng),
        })
      }
    }
    const lng = points.length > 0 ? unwrapLng(points[points.length - 1].lng, stop.lng) : stop.lng
    stopPointIndex.push(points.length)
    points.push({ lat: stop.lat, lng })
  })

  return { points, stopPointIndex }
}

/**
 * Den del af ruten, der er tilbagelagt: alt frem til det senest nåede stop,
 * de mellemliggende bue-punkter der er passeret, og den aktuelle position.
 */
export function traveledPoints(path: JourneyPath, state: PlaybackState): LatLng[] {
  const fromIndex = path.stopPointIndex[state.stopIndex]
  const toIndex = path.stopPointIndex[state.stopIndex + 1] ?? fromIndex
  const passed = Math.floor((toIndex - fromIndex) * state.legFraction)
  const traveled = path.points.slice(0, fromIndex + passed + 1)
  const lastLng = traveled[traveled.length - 1].lng
  return [...traveled, { lat: state.position.lat, lng: unwrapLng(lastLng, state.position.lng) }]
}
