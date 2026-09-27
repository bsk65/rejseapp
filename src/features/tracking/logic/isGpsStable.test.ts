import { describe, expect, it } from 'vitest'
import { isGpsStable } from './isGpsStable'
import type { GpsFix } from './shouldRecordPoint'

const START = '2026-09-27T10:00:00.000Z'

function fix(secondsAfterStart: number, lat: number, lng = 10.2): GpsFix {
  return {
    lat,
    lng,
    timestamp: new Date(Date.parse(START) + secondsAfterStart * 1000).toISOString(),
  }
}

describe('isGpsStable', () => {
  it('is not stable with too few fixes', () => {
    expect(isGpsStable([fix(25, 55.3), fix(26, 55.3)], START)).toBe(false)
  })

  it('is not stable before the warm-up time has passed', () => {
    expect(isGpsStable([fix(5, 55.3), fix(6, 55.3), fix(7, 55.3)], START)).toBe(false)
  })

  it('is stable when consistent fixes arrive after the warm-up time', () => {
    expect(isGpsStable([fix(20, 55.3), fix(21, 55.30001), fix(22, 55.30002)], START)).toBe(true)
  })

  it('is not stable right after a big jump (a coarse fix ~25 km away)', () => {
    // 0.225 grader bredde ≈ 25 km på ét sekund
    expect(isGpsStable([fix(20, 55.525), fix(21, 55.3), fix(22, 55.3)], START)).toBe(false)
  })

  it('becomes stable once enough consistent fixes follow the jump', () => {
    const fixes = [fix(20, 55.525), fix(21, 55.3), fix(22, 55.3), fix(23, 55.3)]
    expect(isGpsStable(fixes, START)).toBe(true)
  })

  it('accepts realistic driving speed between fixes', () => {
    // ~30 m/s (108 km/t): 0.00027 grader bredde ≈ 30 m pr. sekund
    const fixes = [fix(30, 55.3), fix(31, 55.30027), fix(32, 55.30054)]
    expect(isGpsStable(fixes, START)).toBe(true)
  })
})
