import { describe, expect, it } from 'vitest'
import { translatorFor } from '../../../shared/i18n/translator'
import { describeSegment as describeWith } from './describeSegment'
import type { Segment } from '../types'

const describeSegment = (segment: Segment) => describeWith(segment, translatorFor('da'))

function makeSegment(overrides: Partial<Segment>): Segment {
  return {
    id: '1',
    mode: 'fly',
    status: 'planlagt',
    ownerUid: 'uid',
    memberUids: ['uid'],
    ...overrides,
  }
}

const billund = { name: 'Billund', lat: 55.7, lng: 9.1, placeId: 'iata:BLL' }
const paris = { name: 'Paris CDG', lat: 49, lng: 2.5, placeId: 'iata:CDG' }

describe('describeSegment', () => {
  it('asks for details when nothing is filled in', () => {
    expect(describeSegment(makeSegment({ mode: 'fly' }))).toEqual({
      title: 'Fly',
      detail: 'Mangler detaljer — tryk for at udfylde',
    })
  })

  it('shows carrier and number as the title, route and times as detail', () => {
    expect(
      describeSegment(
        makeSegment({
          carrier: 'Air France ',
          number: 'AF1265',
          departurePlace: billund,
          arrivalPlace: paris,
          departureTime: '2026-09-29T17:10',
          arrivalTime: '2026-09-29T19:00',
        }),
      ),
    ).toEqual({
      title: 'Air France AF1265',
      detail: 'Billund → Paris CDG · afgang 17:10 · ankomst 19:00',
    })
  })

  it('uses the note when there is no route or time', () => {
    expect(
      describeSegment(makeSegment({ mode: 'tog', carrier: 'DSB', freeText: 'Pladsbillet' })),
    ).toEqual({ title: 'DSB', detail: 'Pladsbillet' })
  })

  it('shows a partly known route', () => {
    expect(describeSegment(makeSegment({ arrivalPlace: paris })).detail).toBe('? → Paris CDG')
  })
})
