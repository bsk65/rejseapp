import { describe, expect, it } from 'vitest'
import type { Segment, TransportMode } from '../types'
import { translatorFor } from '../../../shared/i18n/translator'
import {
  buildTickets,
  findNextDeparture,
  formatCountdown as formatCountdownWith,
  type TicketEntry,
} from './tickets'

const formatCountdown = (departsAt: string, now: Date) =>
  formatCountdownWith(departsAt, now, translatorFor('da'))

function entry(
  id: string,
  mode: TransportMode,
  departureTime: string | undefined,
  dayNumber = 1,
  dayDate = '2026-10-03',
): TicketEntry {
  const segment: Segment = {
    id,
    mode,
    status: 'planlagt',
    departureTime,
    ownerUid: 'u',
    memberUids: ['u'],
  }
  return { segment, dayId: `d${dayNumber}`, dayNumber, dayDate }
}

describe('buildTickets', () => {
  it('keeps only modes with tickets (not car or walking)', () => {
    const tickets = buildTickets(
      [entry('a', 'bil', '2026-10-03T08:00'), entry('b', 'fly', '2026-10-03T09:00')],
      'alle',
    )
    expect(tickets.map((t) => t.segment.id)).toEqual(['b'])
  })

  it('sorts chronologically across days and time formats', () => {
    const tickets = buildTickets(
      [
        entry('late', 'tog', '2026-10-04T10:15', 2, '2026-10-04'),
        entry('noTime', 'bus', undefined, 1),
        entry('timeOnly', 'færge', '12:30', 1),
        entry('early', 'fly', '2026-10-03T07:40', 1),
      ],
      'alle',
    )
    expect(tickets.map((t) => t.segment.id)).toEqual(['early', 'timeOnly', 'noTime', 'late'])
    expect(tickets[1].departsAt).toBe('2026-10-03T12:30')
  })

  it('filters on a single mode', () => {
    const tickets = buildTickets(
      [entry('a', 'fly', '2026-10-03T07:40'), entry('b', 'tog', '2026-10-03T10:00')],
      'tog',
    )
    expect(tickets.map((t) => t.segment.id)).toEqual(['b'])
  })
})

describe('findNextDeparture', () => {
  const tickets = buildTickets(
    [entry('past', 'fly', '2026-10-03T07:40'), entry('next', 'tog', '2026-10-03T12:00')],
    'alle',
  )

  it('skips departures that have already left', () => {
    expect(findNextDeparture(tickets, new Date('2026-10-03T09:00'))?.segment.id).toBe('next')
  })

  it('returns nothing when everything has left', () => {
    expect(findNextDeparture(tickets, new Date('2026-10-05T09:00'))).toBeUndefined()
  })
})

describe('formatCountdown', () => {
  const now = new Date('2026-10-03T10:00')

  it('shows minutes under an hour', () => {
    expect(formatCountdown('2026-10-03T10:12', now)).toBe('om 12 min')
  })

  it('shows hours and minutes', () => {
    expect(formatCountdown('2026-10-03T12:15', now)).toBe('om 2 t 15 min')
    expect(formatCountdown('2026-10-03T13:00', now)).toBe('om 3 t')
  })

  it('shows days when far away', () => {
    expect(formatCountdown('2026-10-07T10:00', now)).toBe('om 4 dage')
  })
})
