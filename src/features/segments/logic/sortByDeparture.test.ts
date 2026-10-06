import { describe, expect, it } from 'vitest'
import type { Segment } from '../types'
import { sortByDeparture } from './sortByDeparture'

function segment(id: string, departureTime?: string): Segment {
  return { id, mode: 'fly', status: 'planlagt', departureTime, ownerUid: 'u', memberUids: ['u'] }
}

describe('sortByDeparture', () => {
  it('sorterer efter afgangstid, uanset oprettelsesrækkefølge', () => {
    const sorted = sortByDeparture([
      segment('sent', '2027-01-16T21:40'),
      segment('tidligt', '2027-01-16T15:55'),
    ])
    expect(sorted.map((s) => s.id)).toEqual(['tidligt', 'sent'])
  })
  it('lægger segmenter uden tid sidst i oprettelsesrækkefølge', () => {
    const sorted = sortByDeparture([
      segment('a'),
      segment('b', '10:00'),
      segment('c'),
      segment('d', '08:00'),
    ])
    expect(sorted.map((s) => s.id)).toEqual(['d', 'b', 'a', 'c'])
  })
})
