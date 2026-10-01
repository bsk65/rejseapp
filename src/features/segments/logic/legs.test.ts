import { describe, expect, it } from 'vitest'
import type { Segment, TransportMode } from '../types'
import { buildLegs, dayRoute } from './legs'
import type { TicketEntry } from './tickets'

const koln = { name: 'Köln', lat: 50.94, lng: 6.96, placeId: 'koln' }
const bonn = { name: 'Bonn', lat: 50.73, lng: 7.1, placeId: 'bonn' }
const museum = { name: 'Museum', lat: 50.72, lng: 7.11, placeId: 'museum' }

function entry(
  id: string,
  from: typeof koln | undefined,
  to: typeof koln | undefined,
  departureTime?: string,
  dayNumber = 1,
  mode: TransportMode = 'tog',
): TicketEntry {
  const segment: Segment = {
    id,
    mode,
    status: 'planlagt',
    departurePlace: from,
    arrivalPlace: to,
    departureTime,
    ownerUid: 'u',
    memberUids: ['u'],
  }
  return { segment, dayId: `d${dayNumber}`, dayNumber, dayDate: '2026-10-25' }
}

describe('buildLegs', () => {
  it('skips transport without both from and to', () => {
    expect(buildLegs([entry('a', koln, undefined), entry('b', koln, bonn)])).toHaveLength(1)
  })

  it('sorts a day by departure time when every leg has one', () => {
    const legs = buildLegs([entry('home', bonn, koln, '17:30'), entry('out', koln, bonn, '09:10')])
    expect(legs.map((leg) => leg.to.name)).toEqual(['Bonn', 'Köln'])
  })

  it('keeps the created order when a time is missing', () => {
    const legs = buildLegs([entry('home', bonn, koln, '17:30'), entry('out', koln, bonn)])
    expect(legs.map((leg) => leg.to.name)).toEqual(['Köln', 'Bonn'])
  })

  it('orders days by day number', () => {
    const legs = buildLegs([
      entry('b', bonn, koln, undefined, 2),
      entry('a', koln, bonn, undefined, 1),
    ])
    expect(legs.map((leg) => leg.dayNumber)).toEqual([1, 2])
  })
})

describe('dayRoute', () => {
  it('chains the day places and legs without repeating a place', () => {
    const legs = buildLegs([
      entry('1', koln, bonn, '09:00'),
      entry('2', bonn, museum, '10:00', 1, 'gang'),
      entry('3', museum, koln, '16:00'),
    ])
    expect(dayRoute(koln, legs, koln).map((p) => p.name)).toEqual([
      'Köln',
      'Bonn',
      'Museum',
      'Köln',
    ])
  })

  it('works with only the day places', () => {
    expect(dayRoute(koln, [], bonn).map((p) => p.name)).toEqual(['Köln', 'Bonn'])
    expect(dayRoute(koln, [], koln).map((p) => p.name)).toEqual(['Köln'])
  })
})
