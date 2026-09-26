import { describe, expect, it } from 'vitest'
import { mapNominatimResults } from './nominatim'

describe('mapNominatimResults', () => {
  it('shortens display_name to its first segment and converts lat/lng to numbers', () => {
    expect(
      mapNominatimResults([
        {
          place_id: 123,
          display_name: 'Rom, Roma Capitale, Lazio, Italien',
          lat: '41.9028',
          lon: '12.4964',
        },
      ]),
    ).toEqual([{ name: 'Rom', lat: 41.9028, lng: 12.4964, placeId: 'nominatim:123' }])
  })

  it('keeps a single-segment display_name unchanged', () => {
    expect(
      mapNominatimResults([{ place_id: 1, display_name: 'Danmark', lat: '56', lon: '10' }]),
    ).toEqual([{ name: 'Danmark', lat: 56, lng: 10, placeId: 'nominatim:1' }])
  })

  it('returns an empty list for no results', () => {
    expect(mapNominatimResults([])).toEqual([])
  })
})
