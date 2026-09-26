import { describe, expect, it } from 'vitest'
import { matchPhotoToDay } from './matchPhotoToDay'
import type { Day } from '../../days/types'

function makeDay(overrides: Partial<Day>): Day {
  return {
    id: 'day-1',
    dayNumber: 1,
    date: '2026-06-01',
    ownerUid: 'uid',
    memberUids: ['uid'],
    ...overrides,
  }
}

describe('matchPhotoToDay', () => {
  const days = [
    makeDay({ id: 'd1', dayNumber: 1, date: '2026-06-01' }),
    makeDay({ id: 'd2', dayNumber: 2, date: '2026-06-02' }),
  ]

  it('matches a day by the date portion of takenAt', () => {
    expect(matchPhotoToDay('2026-06-02T14:30:00', days)).toBe('d2')
  })

  it('returns undefined when no day matches the date', () => {
    expect(matchPhotoToDay('2026-06-05T10:00:00', days)).toBeUndefined()
  })

  it('returns undefined when takenAt is missing', () => {
    expect(matchPhotoToDay(undefined, days)).toBeUndefined()
  })
})
