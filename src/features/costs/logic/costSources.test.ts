import { describe, expect, it } from 'vitest'
import { translatorFor } from '../../../shared/i18n/translator'
import type { Reservation } from '../../reservations/types'
import type { Segment } from '../../segments/types'
import type { Stay } from '../../stays/types'
import { costSources } from './costSources'

const t = translatorFor('da')
const base = { ownerUid: 'u1', memberUids: ['u1'] }

function segment(id: string, extra: Partial<Segment>): Segment {
  return { id, mode: 'fly', status: 'planlagt', ...base, ...extra }
}

const entry = (s: Segment) => ({ segment: s, dayId: 'd1', dayNumber: 1, dayDate: '2026-12-20' })

describe('costSources', () => {
  it('describes a flight with route and uses its departure date', () => {
    const [source] = costSources(
      [
        entry(
          segment('s1', {
            carrier: 'Air France',
            number: 'AF1265',
            departurePlace: { name: 'Billund', lat: 0, lng: 0, placeId: 'a' },
            arrivalPlace: { name: 'Paris', lat: 0, lng: 0, placeId: 'b' },
            departureTime: '2026-12-21T07:05',
            price: { amount: 1500, currency: 'DKK', dkk: 1500 },
          }),
        ),
      ],
      [],
      [],
      t,
    )
    expect(source).toMatchObject({
      key: 'segment-s1',
      category: 'transport',
      label: 'Air France AF1265 · Billund → Paris',
      date: '2026-12-21',
    })
  })

  it('leaves out car and walking without a price, but keeps a priced rental car', () => {
    const sources = costSources(
      [
        entry(segment('car', { mode: 'bil' })),
        entry(segment('walk', { mode: 'gang' })),
        entry(segment('rental', { mode: 'bil', price: { amount: 900, currency: 'DKK' } })),
        entry(segment('train', { mode: 'tog' })),
      ],
      [],
      [],
      t,
    )
    expect(sources.map((s) => s.key)).toEqual(['segment-rental', 'segment-train'])
  })

  it('maps stays and reservation kinds to their categories', () => {
    const stay: Stay = {
      id: 'h1',
      name: 'Hotel',
      checkInDate: '2026-12-21',
      checkOutDate: '2026-12-23',
      ...base,
    }
    const reservations: Reservation[] = [
      { id: 'r1', kind: 'restaurant', name: 'Middag', date: '2026-12-21', ...base },
      { id: 'r2', kind: 'aktivitet', name: 'Dykning', date: '2026-12-22', ...base },
      { id: 'r3', kind: 'andet', name: 'Museum', date: '2026-12-22', ...base },
    ]
    expect(costSources([], [stay], reservations, t).map((s) => s.category)).toEqual([
      'stays',
      'restaurant',
      'activity',
      'other',
    ])
  })
})
