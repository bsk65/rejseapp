import { describe, expect, it } from 'vitest'
import { computeEndDate, formatDateRange } from './tripDates'

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
