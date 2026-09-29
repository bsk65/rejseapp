import { describe, expect, it } from 'vitest'
import { isTripOver, splitTripsByArchive } from './tripArchive'

describe('isTripOver', () => {
  it('is not over on its last day', () => {
    expect(isTripOver({ startDate: '2026-09-25', days: 5 }, '2026-09-29')).toBe(false)
  })

  it('is over the day after its last day', () => {
    expect(isTripOver({ startDate: '2026-09-25', days: 5 }, '2026-09-30')).toBe(true)
  })

  it('is not over before it starts', () => {
    expect(isTripOver({ startDate: '2026-12-01', days: 3 }, '2026-09-29')).toBe(false)
  })
})

describe('splitTripsByArchive', () => {
  const trips = [
    { id: 'gammel', startDate: '2026-01-10', days: 3 },
    { id: 'senere', startDate: '2026-12-01', days: 3 },
    { id: 'nyere-gammel', startDate: '2026-06-01', days: 7 },
    { id: 'snart', startDate: '2026-10-05', days: 2 },
    { id: 'i-gang', startDate: '2026-09-28', days: 4 },
  ]

  it('puts ongoing and upcoming trips first, soonest first', () => {
    const { current } = splitTripsByArchive(trips, '2026-09-29')
    expect(current.map((t) => t.id)).toEqual(['i-gang', 'snart', 'senere'])
  })

  it('archives finished trips, most recent first', () => {
    const { archived } = splitTripsByArchive(trips, '2026-09-29')
    expect(archived.map((t) => t.id)).toEqual(['nyere-gammel', 'gammel'])
  })
})
