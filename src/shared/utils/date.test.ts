import { describe, expect, it } from 'vitest'
import { addDaysToIsoDate } from './date'

describe('addDaysToIsoDate', () => {
  it('adds a positive offset', () => {
    expect(addDaysToIsoDate('2026-10-03', 4)).toBe('2026-10-07')
  })

  it('returns the same date for a zero offset', () => {
    expect(addDaysToIsoDate('2026-10-03', 0)).toBe('2026-10-03')
  })

  it('rolls over into the next month', () => {
    expect(addDaysToIsoDate('2026-10-30', 3)).toBe('2026-11-02')
  })
})
