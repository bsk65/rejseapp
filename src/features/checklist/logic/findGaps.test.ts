import { describe, expect, it } from 'vitest'
import type { Place } from '../../../shared/types/place'
import type { Day } from '../../days/types'
import type { Reservation } from '../../reservations/types'
import type { TicketEntry } from '../../segments/logic/tickets'
import type { Segment, TransportMode } from '../../segments/types'
import type { Stay } from '../../stays/types'
import { concernsEveryone, findGaps, groupGaps, openGapCount } from './findGaps'
import type { GapInput } from './gapInput'
import { okKeyOf, toggleOkKey } from './okKey'

const place = (name: string, lat: number, lng: number): Place => ({
  name,
  lat,
  lng,
  placeId: name,
})
const odense = place('Odense', 55.4, 10.39)
const billund = place('Billund', 55.74, 9.15) // ~90 km fra Odense
const cph = place('København', 55.62, 12.65)
const rom = place('Rom', 41.9, 12.5)
const romStation = place('Roma Termini', 41.901, 12.501) // ~0,1 km fra Rom
const fiumicino = place('Fiumicino', 41.8, 12.24) // ~25 km fra Rom
const hotelNearby = place('Hotel', 41.912, 12.5) // ~1,3 km fra Rom
const firenze = place('Firenze', 43.77, 11.25)

function makeDays(count: number, from?: Place, to?: Place): Day[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `d${i + 1}`,
    dayNumber: i + 1,
    date: `2026-05-${String(10 + i).padStart(2, '0')}`,
    fromPlace: i === 0 ? from : undefined,
    toPlace: i === count - 1 ? to : undefined,
    ownerUid: 'a',
    memberUids: ['a', 'b'],
  }))
}

let segId = 0
function leg(
  day: number,
  from: Place | undefined,
  to: Place | undefined,
  extra: Partial<Segment> = {},
  mode: TransportMode = 'fly',
): TicketEntry {
  const segment: Segment = {
    id: `s${++segId}`,
    mode,
    status: 'bekræftet',
    departurePlace: from,
    arrivalPlace: to,
    travelerUids: ['a', 'b'],
    ownerUid: 'a',
    memberUids: ['a', 'b'],
    ...extra,
  }
  return {
    segment,
    dayId: `d${day}`,
    dayNumber: day,
    dayDate: `2026-05-${String(9 + day).padStart(2, '0')}`,
  }
}

function stay(name: Place, checkIn: string, checkOut: string, travelerUids?: string[]): Stay {
  return {
    id: `stay-${name.name}-${checkIn}`,
    name: name.name,
    place: name,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    travelerUids,
    ownerUid: 'a',
    memberUids: ['a', 'b'],
  } as Stay
}

function activity(date: string, kind: Reservation['kind'] = 'aktivitet'): Reservation {
  return { id: `r-${date}-${kind}`, kind, name: 'x', date, ownerUid: 'a', memberUids: ['a', 'b'] }
}

/** Rom-tur, 4 dage: fly ud dag 1, hotel i Rom hele vejen, fly hjem dag 4, aktiviteter dag 2+3. */
function completeTrip(): GapInput {
  return {
    days: makeDays(4, odense, odense),
    entries: [
      leg(1, odense, billund, {}, 'bil'),
      leg(1, billund, romStation),
      leg(4, romStation, billund),
      leg(4, billund, odense, {}, 'bil'),
    ],
    stays: [stay(rom, '2026-05-10', '2026-05-13')],
    reservations: [activity('2026-05-11'), activity('2026-05-12')],
  }
}

const kinds = (input: GapInput, people = ['a']) =>
  findGaps(input, people).map((gap) => `${gap.kind}:${gap.dayId}`)

describe('findGaps', () => {
  it('finds nothing on a fully booked trip', () => {
    expect(kinds(completeTrip(), ['a', 'b'])).toEqual([])
  })

  it('finds a night without a place to sleep, but not the last day', () => {
    const input = completeTrip()
    input.stays = [stay(rom, '2026-05-10', '2026-05-12')]
    expect(kinds(input)).toEqual(['overnatning:d3'])
  })

  it('counts a night flight as a place to sleep', () => {
    const input = completeTrip()
    input.stays = [stay(rom, '2026-05-10', '2026-05-12')]
    input.entries[2] = leg(3, romStation, billund, {
      departureTime: '2026-05-12T23:30',
      arrivalTime: '2026-05-13T02:30',
    })
    input.entries[3] = leg(4, billund, odense, {}, 'bil')
    expect(kinds(input)).not.toContain('overnatning:d3')
  })

  it('counts a short layover over midnight as in transit (land 23:00, fly on 02:20)', () => {
    const input = completeTrip()
    input.stays = [stay(rom, '2026-05-11', '2026-05-13')]
    input.entries[1] = leg(1, billund, romStation, {
      departureTime: '2026-05-10T18:00',
      arrivalTime: '2026-05-10T23:00',
    })
    input.entries.push(
      leg(2, romStation, romStation, {
        departureTime: '2026-05-11T02:20',
        arrivalTime: '2026-05-11T04:00',
      }),
    )
    expect(kinds(input)).not.toContain('overnatning:d1')
  })

  it('still needs a bed when the next flight is the following afternoon', () => {
    const input = completeTrip()
    input.stays = [stay(rom, '2026-05-11', '2026-05-13')]
    input.entries[1] = leg(1, billund, romStation, {
      departureTime: '2026-05-10T18:00',
      arrivalTime: '2026-05-10T23:00',
    })
    input.entries.push(leg(2, romStation, romStation, { departureTime: '2026-05-11T14:00' }))
    expect(kinds(input)).toContain('overnatning:d1')
  })

  it('understands a layover where only clock times are known', () => {
    const input = completeTrip()
    input.stays = [stay(rom, '2026-05-11', '2026-05-13')]
    input.entries[1] = leg(1, billund, romStation, { departureTime: '18:00', arrivalTime: '23:00' })
    input.entries.push(leg(2, romStation, romStation, { departureTime: '02:20' }))
    expect(kinds(input)).not.toContain('overnatning:d1')
  })

  it('finds days without an activity — restaurants do not count, flight days are skipped', () => {
    const input = completeTrip()
    input.reservations = [activity('2026-05-11'), activity('2026-05-12', 'restaurant')]
    expect(kinds(input)).toEqual(['aktivitet:d3'])
  })

  it('finds a missing journey between two stays', () => {
    const input = completeTrip()
    input.stays = [stay(rom, '2026-05-10', '2026-05-12'), stay(firenze, '2026-05-12', '2026-05-13')]
    input.entries[2] = leg(4, firenze, billund)
    const gaps = findGaps(input, ['a']).filter((gap) => gap.kind === 'rejse')
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({
      dayId: 'd3',
      reason: 'mellem',
      from: { name: 'Rom' },
      to: { name: 'Firenze' },
    })
  })

  it('needs transport from the airport to a stay more than 2 km away (taxi, boat …)', () => {
    const input = completeTrip()
    input.entries[1] = leg(1, billund, fiumicino)
    const gaps = findGaps(input, ['a']).filter((gap) => gap.kind === 'rejse')
    expect(gaps[0]).toMatchObject({ dayId: 'd1', from: { name: 'Fiumicino' }, to: { name: 'Rom' } })
    input.entries.splice(2, 0, leg(1, fiumicino, rom, {}, 'bil'))
    expect(kinds(input).filter((k) => k.startsWith('rejse'))).not.toContain('rejse:d1')
  })

  it('treats a stay without an address as far from everything but itself', () => {
    const input = completeTrip()
    input.stays = [{ ...stay(rom, '2026-05-10', '2026-05-13'), place: undefined, name: 'Lodge' }]
    const gaps = findGaps(input, ['a']).filter((gap) => gap.kind === 'rejse')
    expect(gaps.map((gap) => [gap.dayId, gap.from?.name, gap.to?.name])).toEqual([
      ['d1', 'Roma Termini', 'Lodge'],
      ['d4', 'Lodge', 'Roma Termini'],
    ])
  })

  it('ignores a placeholder stay on a night spent on board', () => {
    const input = completeTrip()
    input.stays = [
      stay(rom, '2026-05-10', '2026-05-12'),
      { ...stay(rom, '2026-05-12', '2026-05-13'), place: undefined, name: 'Natfly' },
    ]
    input.entries[2] = leg(3, romStation, billund, {
      departureTime: '2026-05-12T23:30',
      arrivalTime: '2026-05-13T02:30',
    })
    expect(kinds(input).filter((k) => k.startsWith('rejse'))).toEqual([])
  })

  it('needs transport between two stays more than 2 km apart, not between ones closer', () => {
    const input = completeTrip()
    input.stays = [
      stay(rom, '2026-05-10', '2026-05-11'),
      stay(hotelNearby, '2026-05-11', '2026-05-13'),
    ]
    expect(kinds(input).filter((k) => k.startsWith('rejse'))).toEqual([])
    input.stays[1] = stay(fiumicino, '2026-05-11', '2026-05-13')
    expect(kinds(input).filter((k) => k.startsWith('rejse'))).toContain('rejse:d2')
  })

  it('finds a missing outbound and homebound journey', () => {
    const input = completeTrip()
    input.entries = []
    const gaps = findGaps(input, ['a']).filter((gap) => gap.kind === 'rejse')
    expect(gaps.map((gap) => [gap.dayId, gap.reason])).toEqual([
      ['d1', 'udrejse'],
      ['d4', 'hjemrejse'],
    ])
  })

  it('uses the day’s Til when there is no stay', () => {
    const input = completeTrip()
    input.stays = []
    input.days[1].toPlace = cph
    expect(findGaps(input, ['a']).filter((g) => g.kind === 'rejse')[0]).toMatchObject({
      dayId: 'd2',
      from: { name: 'Roma Termini' },
      to: { name: 'København' },
    })
  })

  it('lists planned (unconfirmed) transport, but not own car or walking', () => {
    const input = completeTrip()
    input.entries[1] = leg(1, billund, romStation, { status: 'planlagt' })
    input.entries[3] = leg(4, billund, odense, { status: 'planlagt' }, 'bil')
    expect(kinds(input)).toEqual(['ubekraeftet:d1'])
  })

  it('merges gaps that several people share and marks who a gap concerns', () => {
    const input = completeTrip()
    input.stays = [stay(rom, '2026-05-10', '2026-05-13', ['a'])]
    const gaps = findGaps(input, ['a', 'b'])
    const nights = gaps.filter((gap) => gap.kind === 'overnatning')
    expect(nights.map((gap) => gap.people)).toEqual([['b'], ['b'], ['b']])
    expect(concernsEveryone(nights[0], ['a', 'b'])).toBe(false)
  })

  it('separates gaps marked OK on their day', () => {
    const input = completeTrip()
    input.reservations = []
    input.days[1].checksOk = ['aktivitet']
    const groups = groupGaps(findGaps(input, ['a']), input.days)
    const activities = groups.find((group) => group.kind === 'aktivitet')
    expect(activities?.open.map((gap) => gap.dayId)).toEqual(['d3'])
    expect(activities?.ok.map((gap) => gap.dayId)).toEqual(['d2'])
    expect(openGapCount(groups)).toBe(1)
  })

  it('marks only the one journey OK, not other missing journeys the same day', () => {
    const input = completeTrip()
    input.entries[1] = leg(1, billund, fiumicino)
    input.stays = [{ ...stay(rom, '2026-05-10', '2026-05-13'), place: undefined, name: 'Lodge' }]
    input.entries.splice(1, 0, leg(1, cph, billund))
    const before = findGaps(input, ['a']).filter((g) => g.kind === 'rejse' && g.dayId === 'd1')
    expect(before).toHaveLength(2)
    const first = before[0]
    input.days[0].checksOk = toggleOkKey(['rejse'], okKeyOf(first) as string, true)
    expect(input.days[0].checksOk).not.toContain('rejse')
    const travel = groupGaps(findGaps(input, ['a']), input.days).find((g) => g.kind === 'rejse')
    expect(travel?.ok.map((gap) => gap.key)).toEqual([first.key])
    expect(travel?.open.map((gap) => gap.key)).toContain(before[1].key)
  })

  it('ignores an old plain "rejse" mark', () => {
    const input = completeTrip()
    input.entries = []
    input.days[0].checksOk = ['rejse']
    const travel = groupGaps(findGaps(input, ['a']), input.days).find((g) => g.kind === 'rejse')
    expect(travel?.ok).toEqual([])
  })
})
