import { describe, expect, it } from 'vitest'
import { placeLabel } from './placeLabel'

describe('placeLabel', () => {
  it('adds the area when known', () => {
    expect(
      placeLabel({ name: 'Hjem', area: 'Málaga, Spanien', lat: 0, lng: 0, placeId: 'x' }),
    ).toBe('Hjem · Málaga, Spanien')
  })

  it('shows just the name for older places without an area', () => {
    expect(placeLabel({ name: 'Paris', lat: 0, lng: 0, placeId: 'x' })).toBe('Paris')
  })
})
