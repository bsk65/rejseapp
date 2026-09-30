import { describe, expect, it } from 'vitest'
import { isEndDay, planDayRemoval } from './removeEndDay'

const days = [
  { id: 'a', dayNumber: 1, date: '2026-10-23' },
  { id: 'b', dayNumber: 2, date: '2026-10-24' },
  { id: 'c', dayNumber: 3, date: '2026-10-25' },
]

describe('isEndDay', () => {
  it('is true for the first and last day only', () => {
    expect(isEndDay('2026-10-23', 3, '2026-10-23')).toBe(true)
    expect(isEndDay('2026-10-23', 3, '2026-10-24')).toBe(false)
    expect(isEndDay('2026-10-23', 3, '2026-10-25')).toBe(true)
  })

  it('is false for the only day of a 1-day trip', () => {
    expect(isEndDay('2026-10-23', 1, '2026-10-23')).toBe(false)
  })
})

describe('planDayRemoval', () => {
  it('removing the first day moves the start and renumbers the rest', () => {
    expect(planDayRemoval('2026-10-23', 3, days, 'a')).toEqual({
      startDate: '2026-10-24',
      days: 2,
      renumbered: [
        { id: 'b', dayNumber: 1 },
        { id: 'c', dayNumber: 2 },
      ],
    })
  })

  it('removing the last day only shortens the trip', () => {
    expect(planDayRemoval('2026-10-23', 3, days, 'c')).toEqual({
      startDate: '2026-10-23',
      days: 2,
      renumbered: [],
    })
  })

  it('refuses a day in the middle', () => {
    expect(planDayRemoval('2026-10-23', 3, days, 'b')).toBeNull()
  })

  it('refuses an unknown day', () => {
    expect(planDayRemoval('2026-10-23', 3, days, 'zzz')).toBeNull()
  })
})
