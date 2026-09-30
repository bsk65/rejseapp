import { describe, expect, it } from 'vitest'
import { planTripExtension } from './extendTrip'

const days = [
  { id: 'a', dayNumber: 1, date: '2026-10-24' },
  { id: 'b', dayNumber: 2, date: '2026-10-25' },
  { id: 'c', dayNumber: 3, date: '2026-10-26' },
]

describe('planTripExtension', () => {
  it('adds days before the start and renumbers the existing days', () => {
    const plan = planTripExtension('2026-10-24', 3, days, 2, 0)
    expect(plan.startDate).toBe('2026-10-22')
    expect(plan.days).toBe(5)
    expect(plan.added).toEqual([
      { dayNumber: 1, date: '2026-10-22' },
      { dayNumber: 2, date: '2026-10-23' },
    ])
    expect(plan.renumbered).toEqual([
      { id: 'a', dayNumber: 3 },
      { id: 'b', dayNumber: 4 },
      { id: 'c', dayNumber: 5 },
    ])
  })

  it('adds days after the end without renumbering', () => {
    const plan = planTripExtension('2026-10-24', 3, days, 0, 2)
    expect(plan.startDate).toBe('2026-10-24')
    expect(plan.days).toBe(5)
    expect(plan.added).toEqual([
      { dayNumber: 4, date: '2026-10-27' },
      { dayNumber: 5, date: '2026-10-28' },
    ])
    expect(plan.renumbered).toEqual([])
  })

  it('handles both directions at once, across a month boundary', () => {
    const plan = planTripExtension(
      '2026-10-01',
      1,
      [{ id: 'x', dayNumber: 1, date: '2026-10-01' }],
      1,
      1,
    )
    expect(plan.startDate).toBe('2026-09-30')
    expect(plan.added.map((d) => d.date)).toEqual(['2026-09-30', '2026-10-02'])
    expect(plan.renumbered).toEqual([{ id: 'x', dayNumber: 2 }])
  })

  it('fills in a missing day instead of creating a duplicate', () => {
    const gap = [days[0], days[2]]
    const plan = planTripExtension('2026-10-24', 3, gap, 0, 0)
    expect(plan.added).toEqual([{ dayNumber: 2, date: '2026-10-25' }])
  })
})
