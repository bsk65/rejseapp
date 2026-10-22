import { describe, expect, it } from 'vitest'
import type { Reservation } from '../../reservations/types'
import type { TicketEntry } from '../../segments/logic/tickets'
import type { Segment } from '../../segments/types'
import type { Stay } from '../../stays/types'
import { buildCalendarDays, stayBars, visibleHours } from './calendarLayout'

function entry(id: string, dayDate: string, overrides: Partial<Segment>): TicketEntry {
  return {
    dayId: `dag-${dayDate}`,
    dayNumber: 1,
    dayDate,
    segment: {
      id,
      mode: 'fly',
      status: 'planlagt',
      ownerUid: 'uid',
      memberUids: ['uid'],
      ...overrides,
    },
  }
}

function reservation(id: string, date: string, time?: string): Reservation {
  return { id, kind: 'restaurant', name: id, date, time, ownerUid: 'uid', memberUids: ['uid'] }
}

function stay(id: string, checkInDate: string, checkOutDate: string): Stay {
  return { id, name: id, checkInDate, checkOutDate, ownerUid: 'uid', memberUids: ['uid'] }
}

describe('buildCalendarDays', () => {
  it('places a flight from departure to arrival', () => {
    const days = buildCalendarDays(
      [
        entry('af', '2026-10-03', {
          departureTime: '2026-10-03T07:40',
          arrivalTime: '2026-10-03T10:05',
        }),
      ],
      [],
    )
    expect(days.get('2026-10-03')?.timed).toMatchObject([
      { start: 7 * 60 + 40, end: 10 * 60 + 5, continued: false, lane: 0, lanes: 1 },
    ])
  })

  it('uses the real flight time when the time zones are known', () => {
    // Billund 10:00 (+02:00) → London 11:00 (+01:00): 2 timer, ikke 1.
    const days = buildCalendarDays(
      [
        entry('ba', '2026-10-03', {
          departureTime: '2026-10-03T10:00',
          departureUtcOffset: '+02:00',
          arrivalTime: '2026-10-03T11:00',
          arrivalUtcOffset: '+01:00',
        }),
      ],
      [],
    )
    expect(days.get('2026-10-03')?.timed[0]).toMatchObject({ start: 600, end: 720 })
  })

  it('splits an overnight flight over two days', () => {
    const days = buildCalendarDays(
      [
        entry('tk', '2026-12-28', {
          departureTime: '2026-12-28T21:40',
          departureUtcOffset: '+03:00',
          arrivalTime: '2026-12-29T13:55',
          arrivalUtcOffset: '+07:00',
        }),
      ],
      [],
    )
    expect(days.get('2026-12-28')?.timed[0]).toMatchObject({ start: 1300, end: 1440 })
    expect(days.get('2026-12-29')?.timed[0]).toMatchObject({
      start: 0,
      end: 735 - 140,
      continued: true,
    })
  })

  it('puts overlapping things side by side', () => {
    const days = buildCalendarDays(
      [entry('tog', '2026-10-03', { departureTime: '2026-10-03T12:00' })],
      [reservation('frokost', '2026-10-03', '12:30'), reservation('aften', '2026-10-03', '19:00')],
    )
    const timed = days.get('2026-10-03')?.timed ?? []
    expect(timed.map((event) => [event.key, event.lane, event.lanes])).toEqual([
      ['segment:tog:0', 0, 2],
      ['reservation:frokost:0', 1, 2],
      ['reservation:aften:0', 0, 1],
    ])
  })

  it('keeps things without a time apart', () => {
    const days = buildCalendarDays(
      [entry('bil', '2026-10-03', { mode: 'bil' })],
      [reservation('museum', '2026-10-04')],
    )
    expect(days.get('2026-10-03')).toMatchObject({ timed: [], untimed: [{ key: 'segment:bil' }] })
    expect(days.get('2026-10-04')?.untimed).toMatchObject([{ key: 'reservation:museum' }])
  })
})

describe('visibleHours', () => {
  it('shows 07–22 unless something lies outside', () => {
    expect(visibleHours(buildCalendarDays([], []))).toEqual({ first: 7, last: 22 })
    const early = buildCalendarDays(
      [entry('x', '2026-10-03', { departureTime: '2026-10-03T05:30' })],
      [reservation('sent', '2026-10-03', '22:30')],
    )
    expect(visibleHours(early)).toEqual({ first: 5, last: 24 })
  })
})

describe('stayBars', () => {
  const dates = ['2026-10-01', '2026-10-02', '2026-10-03']

  it('spans from check-in to check-out and stacks stays that meet on a changeover day', () => {
    const bars = stayBars(
      [stay('rom', '2026-10-02', '2026-10-05'), stay('paris', '2026-09-29', '2026-10-02')],
      dates,
    )
    expect(bars.map((bar) => [bar.stay.id, bar.startColumn, bar.endColumn, bar.row])).toEqual([
      ['paris', 0, 1, 0],
      ['rom', 1, 2, 1],
    ])
    expect(bars[0]).toMatchObject({ startsBefore: true, endsAfter: false })
    expect(bars[1]).toMatchObject({ startsBefore: false, endsAfter: true })
  })

  it('reuses a row when the previous stay ended the day before', () => {
    const bars = stayBars(
      [stay('a', '2026-10-01', '2026-10-02'), stay('b', '2026-10-03', '2026-10-04')],
      dates,
    )
    expect(bars.map((bar) => bar.row)).toEqual([0, 0])
  })

  it('leaves out stays outside the shown days', () => {
    expect(stayBars([stay('senere', '2026-10-10', '2026-10-12')], dates)).toEqual([])
  })
})
