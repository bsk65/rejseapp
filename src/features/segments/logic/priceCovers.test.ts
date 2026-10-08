import { describe, expect, it } from 'vitest'
import type { Segment } from '../types'
import { coverCandidates, toggleCovered } from './priceCovers'
import type { TicketEntry } from './tickets'

function entry(id: string, dayDate: string, extra: Partial<Segment> = {}): TicketEntry {
  return {
    segment: { id, mode: 'fly', status: 'planlagt', ownerUid: 'u', memberUids: ['u'], ...extra },
    dayId: dayDate,
    dayNumber: 1,
    dayDate,
  }
}

describe('coverCandidates', () => {
  it('leaves out the segment itself and walks, sorted by departure', () => {
    const entries = [
      entry('home', '2027-01-16', { departureTime: '2027-01-16T21:40' }),
      entry('self', '2026-12-27'),
      entry('walk', '2026-12-28', { mode: 'gang' }),
      entry('early', '2027-01-16', { departureTime: '2027-01-16T15:55' }),
      entry('out2', '2026-12-28', { departureTime: '02:20' }),
    ]
    expect(coverCandidates(entries, 'self').map((e) => e.segment.id)).toEqual([
      'out2',
      'early',
      'home',
    ])
  })
})

describe('toggleCovered', () => {
  it('adds and removes an id', () => {
    expect(toggleCovered(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleCovered(['a', 'b'], 'a')).toEqual(['b'])
  })
})
