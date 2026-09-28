import { describe, expect, it } from 'vitest'
import type { Stay } from '../../stays/types'
import { stayMoments } from '../../stays/logic/stayDates'
import type { Segment } from '../types'
import { buildTicketTimeline, findNextItem } from './ticketTimeline'
import { buildTickets } from './tickets'

function flight(id: string, departureTime: string): Segment {
  return { id, mode: 'fly', status: 'planlagt', departureTime, ownerUid: 'a', memberUids: ['a'] }
}

const hotel: Stay = {
  id: 'h',
  name: 'Hotel',
  checkInDate: '2026-09-29',
  checkInTime: '15:00',
  checkOutDate: '2026-10-02',
  checkOutTime: '11:00',
  ownerUid: 'a',
  memberUids: ['a'],
}

const tickets = buildTickets(
  [
    {
      segment: flight('out', '2026-09-29T12:00'),
      dayId: 'd1',
      dayNumber: 1,
      dayDate: '2026-09-29',
    },
    {
      segment: flight('home', '2026-10-02T14:00'),
      dayId: 'd4',
      dayNumber: 4,
      dayDate: '2026-10-02',
    },
  ],
  'alle',
)

describe('buildTicketTimeline', () => {
  it('interleaves flights and check-in/out by time', () => {
    const items = buildTicketTimeline(tickets, stayMoments([hotel]))
    expect(items.map((item) => item.key)).toEqual(['out', 'h:indtjek', 'h:udtjek', 'home'])
  })
})

describe('findNextItem', () => {
  it('can find a check-in as the next thing', () => {
    const items = buildTicketTimeline(tickets, stayMoments([hotel]))
    expect(findNextItem(items, new Date('2026-09-29T13:00'))?.key).toBe('h:indtjek')
  })
})
