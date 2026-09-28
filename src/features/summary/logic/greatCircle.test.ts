import { describe, expect, it } from 'vitest'
import { interpolateGreatCircle, unwrapLng } from './greatCircle'

describe('interpolateGreatCircle', () => {
  it('returns the endpoints at 0 and 1', () => {
    const a = { lat: 55.6, lng: 12.6 }
    const b = { lat: 40.6, lng: -73.8 }
    expect(interpolateGreatCircle(a, b, 0).lat).toBeCloseTo(a.lat)
    expect(interpolateGreatCircle(a, b, 1).lng).toBeCloseTo(b.lng)
  })

  it('bends north on a long east-west flight (great circle)', () => {
    const mid = interpolateGreatCircle({ lat: 55.6, lng: 12.6 }, { lat: 40.6, lng: -73.8 }, 0.5)
    expect(mid.lat).toBeGreaterThan(55)
  })

  it('follows the equator between points on it', () => {
    const mid = interpolateGreatCircle({ lat: 0, lng: 0 }, { lat: 0, lng: 90 }, 0.5)
    expect(mid.lat).toBeCloseTo(0)
    expect(mid.lng).toBeCloseTo(45)
  })
})

describe('unwrapLng', () => {
  it('keeps a line across the date line short', () => {
    expect(unwrapLng(179, -179)).toBe(181)
    expect(unwrapLng(-179, 179)).toBe(-181)
    expect(unwrapLng(10, 12)).toBe(12)
  })
})
