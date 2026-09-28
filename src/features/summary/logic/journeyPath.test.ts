import { describe, expect, it } from 'vitest'
import type { JourneyStop } from '../types'
import { buildJourneyPath, traveledPoints } from './journeyPath'
import type { PlaybackState } from './timeline'

function stop(lat: number, lng: number): JourneyStop {
  return { lat, lng, kind: 'spor', time: 0 }
}

function state(stopIndex: number, legFraction: number, lat: number, lng: number): PlaybackState {
  return { position: { lat, lng }, stopIndex, km: 0, legKm: 0, legFraction, holdingStop: null }
}

describe('buildJourneyPath', () => {
  it('keeps short legs as single segments', () => {
    const path = buildJourneyPath([stop(55, 10), stop(55.01, 10), stop(55.02, 10)])
    expect(path.points).toHaveLength(3)
    expect(path.stopPointIndex).toEqual([0, 1, 2])
  })

  it('splits long legs into an arc', () => {
    const path = buildJourneyPath([stop(55.6, 12.6), stop(40.6, -73.8)])
    expect(path.points.length).toBeGreaterThan(50)
    expect(path.stopPointIndex[1]).toBe(path.points.length - 1)
  })

  it('unwraps longitudes across the date line', () => {
    const path = buildJourneyPath([stop(35, 179.5), stop(35, -179.5)])
    expect(path.points[path.points.length - 1].lng).toBeCloseTo(180.5)
  })
})

describe('traveledPoints', () => {
  const path = buildJourneyPath([stop(55.6, 12.6), stop(40.6, -73.8), stop(40.7, -73.9)])

  it('includes passed arc points and ends at the current position', () => {
    const traveled = traveledPoints(path, state(0, 0.5, 60, -30))
    const arcLength = path.stopPointIndex[1]
    expect(traveled.length).toBe(Math.floor(arcLength * 0.5) + 2)
    expect(traveled[traveled.length - 1]).toEqual({ lat: 60, lng: -30 })
  })

  it('includes the whole route at the end', () => {
    const traveled = traveledPoints(path, state(2, 0, 40.7, -73.9))
    expect(traveled.length).toBe(path.points.length + 1)
  })
})
