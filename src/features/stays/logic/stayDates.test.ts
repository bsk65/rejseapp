import { describe, expect, it } from 'vitest'
import type { Stay } from '../types'
import { nightCount, stayEventsForDate, stayMoments, validateStayDates } from './stayDates'

function stay(
  id: string,
  checkInDate: string,
  checkOutDate: string,
  extra: Partial<Stay> = {},
): Stay {
  return { id, name: id, checkInDate, checkOutDate, ownerUid: 'a', memberUids: ['a'], ...extra }
}

describe('nightCount', () => {
  it('counts nights across a month boundary', () => {
    expect(nightCount('2026-09-29', '2026-10-02')).toBe(3)
  })
})

describe('validateStayDates', () => {
  it('requires both dates', () => {
    expect(validateStayDates('2026-09-29', '')).not.toBeNull()
  })

  it('requires check-out after check-in', () => {
    expect(validateStayDates('2026-09-29', '2026-09-29')).not.toBeNull()
    expect(validateStayDates('2026-09-29', '2026-09-30')).toBeNull()
  })
})

describe('stayEventsForDate', () => {
  const paris = stay('paris', '2026-09-29', '2026-10-01')
  const rome = stay('rome', '2026-10-01', '2026-10-03')

  it('marks check-in, nights and check-out', () => {
    expect(stayEventsForDate([paris], '2026-09-29')).toEqual([{ stay: paris, kind: 'indtjek' }])
    expect(stayEventsForDate([paris], '2026-09-30')).toEqual([{ stay: paris, kind: 'nat' }])
    expect(stayEventsForDate([paris], '2026-10-01')).toEqual([{ stay: paris, kind: 'udtjek' }])
    expect(stayEventsForDate([paris], '2026-10-02')).toEqual([])
  })

  it('puts check-out before check-in on a changeover day', () => {
    expect(stayEventsForDate([rome, paris], '2026-10-01').map((e) => e.kind)).toEqual([
      'udtjek',
      'indtjek',
    ])
  })
})

describe('stayMoments', () => {
  it('gives a check-in and a check-out, with a full time when known', () => {
    const moments = stayMoments([
      stay('paris', '2026-09-29', '2026-10-01', { checkInTime: '15:00' }),
    ])
    expect(moments.map((m) => [m.kind, m.date, m.at])).toEqual([
      ['indtjek', '2026-09-29', '2026-09-29T15:00'],
      ['udtjek', '2026-10-01', undefined],
    ])
  })
})
