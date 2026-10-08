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

  it('lists flights covered by another flight’s price under that price, not as missing', () => {
    const sources = costSources(
      [
        entry(
          segment('ud1', {
            number: 'TK1784',
            price: { amount: 12000, currency: 'DKK', dkk: 12000 },
            priceCovers: ['ud2', 'hjem1', 'own'],
          }),
        ),
        entry(segment('ud2', { number: 'TK56' })),
        entry(segment('hjem1', { number: 'TK57' })),
        // Har sin egen pris — tælles selv, ikke som "inkl."
        entry(segment('own', { number: 'GA1', price: { amount: 900, currency: 'DKK' } })),
        entry(segment('alone', { number: 'XX1' })),
      ],
      [],
      [],
      t,
    )
    expect(sources.map((s) => s.key)).toEqual(['segment-ud1', 'segment-own', 'segment-alone'])
    expect(sources[0]?.includes).toEqual(['TK56', 'TK57'])
  })

  it('does not hide flights when the covering flight has no price', () => {
    const sources = costSources(
      [entry(segment('a', { priceCovers: ['b'] })), entry(segment('b', {}))],
      [],
      [],
      t,
    )
    expect(sources.map((s) => s.key)).toEqual(['segment-a', 'segment-b'])
  })

  it('counts a per-person price once per traveller, a shared price once', () => {
    const price = { amount: 6000, currency: 'DKK', dkk: 6000 }
    const [perPerson, shared] = costSources(
      [
        entry(segment('a', { price, priceFor: 'person', travelerUids: ['u1', 'u2'] })),
        entry(segment('b', { price, priceFor: 'alle', travelerUids: ['u1', 'u2'] })),
      ],
      [],
      [],
      t,
    )
    expect(perPerson?.quantity).toBe(2)
    expect(shared?.quantity).toBeUndefined()
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
