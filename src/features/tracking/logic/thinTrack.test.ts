import { describe, expect, it } from 'vitest'
import type { GpsFix } from './shouldRecordPoint'
import { thinTrack } from './thinTrack'

/** Et spor mod nord med et punkt hvert sekund og ~11 m mellem punkterne. */
function walk(count: number): GpsFix[] {
  return Array.from({ length: count }, (_, i) => ({
    lat: 55 + i * 0.0001,
    lng: 10,
    timestamp: new Date(Date.UTC(2026, 9, 3, 8, 0, i)).toISOString(),
  }))
}

describe('thinTrack', () => {
  it('returns an empty track unchanged', () => {
    expect(thinTrack([])).toEqual([])
  })

  it('keeps roughly one point per 50 m', () => {
    // 100 punkter * ~11 m ≈ 1100 m → ca. 22 punkter + slutpunkt
    const thinned = thinTrack(walk(100))
    expect(thinned.length).toBeGreaterThan(18)
    expect(thinned.length).toBeLessThan(26)
  })

  it('always keeps the first and last point', () => {
    const fixes = walk(100)
    const thinned = thinTrack(fixes)
    expect(thinned[0]).toBe(fixes[0])
    expect(thinned[thinned.length - 1]).toBe(fixes[99])
  })

  it('increases the spacing until the track fits under the limit', () => {
    expect(thinTrack(walk(2000), 50).length).toBeLessThanOrEqual(50)
  })
})
