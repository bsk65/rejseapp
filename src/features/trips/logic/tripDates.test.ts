import { describe, expect, it } from 'vitest'
import { computeEndDate, countTripDays, formatDateRange, parseDayCount } from './tripDates'

describe('computeEndDate', () => {
  it('returns the same date for a 1-day trip', () => {
    expect(computeEndDate('2026-10-03', 1)).toBe('2026-10-03')
  })

  it('adds days-1 to the start date', () => {
    expect(computeEndDate('2026-10-03', 5)).toBe('2026-10-07')
  })

  it('rolls over into the next month', () => {
    expect(computeEndDate('2026-10-30', 4)).toBe('2026-11-02')
  })
})

describe('formatDateRange', () => {
  it('shows a single date for a 1-day trip', () => {
    expect(formatDateRange('2026-10-03', 1)).toBe('2026-10-03')
  })

  it('shows a range for a multi-day trip', () => {
    expect(formatDateRange('2026-10-03', 5)).toBe('2026-10-03 – 2026-10-07')
  })
})

describe('countTripDays', () => {
  it('counts both the start and end day', () => {
    expect(countTripDays('2026-10-03', '2026-10-06')).toBe(4)
    expect(countTripDays('2026-10-03', '2026-10-03')).toBe(1)
  })

  it('handles month boundaries', () => {
    expect(countTripDays('2026-10-30', '2026-11-02')).toBe(4)
  })

  it('returns undefined when a date is missing or the end is before the start', () => {
    expect(countTripDays('', '2026-10-06')).toBeUndefined()
    expect(countTripDays('2026-10-06', '2026-10-03')).toBeUndefined()
  })

  it('is the inverse of computeEndDate', () => {
    expect(countTripDays('2026-10-03', computeEndDate('2026-10-03', 9))).toBe(9)
  })
})

describe('parseDayCount', () => {
  it('accepts whole numbers from 1', () => {
    expect(parseDayCount('4')).toBe(4)
    expect(parseDayCount('12')).toBe(12)
  })

  it('rejects empty, zero and non-numbers', () => {
    expect(parseDayCount('')).toBeUndefined()
    expect(parseDayCount('0')).toBeUndefined()
    expect(parseDayCount('4,5')).toBeUndefined()
  })
})
