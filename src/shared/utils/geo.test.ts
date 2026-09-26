import { describe, expect, it } from 'vitest'
import { distanceMeters } from './geo'

describe('distanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(distanceMeters({ lat: 55.4, lng: 10.4 }, { lat: 55.4, lng: 10.4 })).toBe(0)
  })

  it('computes Copenhagen to Odense as roughly 135 km', () => {
    const km = distanceMeters({ lat: 55.6761, lng: 12.5683 }, { lat: 55.4038, lng: 10.4024 }) / 1000
    expect(km).toBeGreaterThan(130)
    expect(km).toBeLessThan(140)
  })

  it('computes one degree of latitude as roughly 111 km', () => {
    const km = distanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) / 1000
    expect(km).toBeCloseTo(111.2, 0)
  })
})
