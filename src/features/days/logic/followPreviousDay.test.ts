import { describe, expect, it } from 'vitest'
import type { Place } from '../../../shared/types/place'
import type { Day } from '../types'
import { effectiveFromPlace, shouldFollowPreviousTo } from './followPreviousDay'

const rome: Place = { name: 'Rom', lat: 41.9, lng: 12.5, placeId: 'rome' }
const florence: Place = { name: 'Firenze', lat: 43.8, lng: 11.3, placeId: 'florence' }
const pisa: Place = { name: 'Pisa', lat: 43.7, lng: 10.4, placeId: 'pisa' }

function day(dayNumber: number, fromPlace?: Place, toPlace?: Place): Day {
  return {
    id: `d${dayNumber}`,
    dayNumber,
    date: '2026-10-03',
    fromPlace,
    toPlace,
    ownerUid: 'u',
    memberUids: ['u'],
  }
}

describe('shouldFollowPreviousTo', () => {
  it('fills an empty "from" on the next day', () => {
    expect(shouldFollowPreviousTo(day(2), rome)).toBe(true)
  })

  it('follows along when the next day\'s "from" was just the old "to"', () => {
    expect(shouldFollowPreviousTo(day(2, rome), rome)).toBe(true)
  })

  it('keeps a "from" the user chose on purpose', () => {
    expect(shouldFollowPreviousTo(day(2, pisa), rome)).toBe(false)
  })

  it('does nothing on the last day', () => {
    expect(shouldFollowPreviousTo(undefined, rome)).toBe(false)
  })
})

describe('effectiveFromPlace', () => {
  it("uses the day's own from when set", () => {
    expect(effectiveFromPlace(day(2, pisa), day(1, undefined, rome))).toBe(pisa)
  })

  it("falls back to the previous day's to", () => {
    expect(effectiveFromPlace(day(2), day(1, undefined, florence))).toBe(florence)
  })

  it('is empty on day 1 without a from', () => {
    expect(effectiveFromPlace(day(1), undefined)).toBeUndefined()
  })
})
