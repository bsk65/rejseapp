import { describe, expect, it } from 'vitest'
import type { Day } from '../types'
import { initiallyExpandedDayIds, routeLabel } from './daySummary'

const billund = { name: 'Billund', lat: 55.7, lng: 9.1, placeId: 'bll' }
const paris = { name: 'Paris', lat: 48.9, lng: 2.3, placeId: 'par' }

describe('routeLabel', () => {
  it('shows from → to', () => {
    expect(routeLabel(billund, paris)).toBe('Billund → Paris')
  })

  it('shows one name when both are the same place, or only one is known', () => {
    expect(routeLabel(paris, paris)).toBe('Paris')
    expect(routeLabel(undefined, paris)).toBe('Paris')
    expect(routeLabel(billund, undefined)).toBe('Billund')
  })

  it('is empty without places', () => {
    expect(routeLabel(undefined, undefined)).toBeUndefined()
  })
})

describe('initiallyExpandedDayIds', () => {
  const days = ['2026-09-29', '2026-09-30', '2026-10-01'].map((date, i): Day => ({
    id: `d${i + 1}`,
    dayNumber: i + 1,
    date,
    ownerUid: 'a',
    memberUids: ['a'],
  }))

  it("opens only today's day", () => {
    expect(initiallyExpandedDayIds(days, '2026-09-30')).toEqual(['d2'])
  })

  it('opens nothing before or after the trip', () => {
    expect(initiallyExpandedDayIds(days, '2026-09-28')).toEqual([])
  })
})
