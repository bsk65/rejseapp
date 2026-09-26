import { describe, expect, it } from 'vitest'
import { describeSegment } from './describeSegment'
import type { Segment } from '../types'

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

describe('describeSegment', () => {
  it('shows "mangler detaljer" when no details are filled in', () => {
    expect(describeSegment(makeSegment({ mode: 'fly' }))).toBe('Fly, mangler detaljer')
  })

  it('includes the carrier when set', () => {
    expect(describeSegment(makeSegment({ mode: 'tog', carrier: 'DSB' }))).toBe('Tog, DSB')
  })

  it('includes departure time alongside the carrier', () => {
    expect(
      describeSegment(
        makeSegment({ mode: 'fly', carrier: 'SAS', departureTime: '2026-06-01T10:00' }),
      ),
    ).toBe('Fly, SAS, afgang 2026-06-01T10:00')
  })
})
