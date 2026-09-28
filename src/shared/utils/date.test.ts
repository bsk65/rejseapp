import { describe, expect, it } from 'vitest'
import { addDaysToIsoDate, formatDayDate, localIsoDate } from './date'

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

describe('formatDayDate', () => {
  it('formats with weekday, day and month in Danish', () => {
    expect(formatDayDate('2026-10-03')).toBe('lør. 3. okt.')
  })
})

describe('localIsoDate', () => {
  it('formats the local calendar date, also late in the evening', () => {
    expect(localIsoDate(new Date(2026, 9, 4, 23, 30).getTime())).toBe('2026-10-04')
  })
})
