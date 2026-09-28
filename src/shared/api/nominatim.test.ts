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

  it('adds town and country so places with the same name can be told apart', () => {
    const [place] = mapNominatimResults([
      {
        place_id: 296127387,
        display_name: 'Hjem, Calle Larios, Centro, Málaga, Andalusien, Spanien',
        lat: '36.72',
        lon: '-4.42',
        address: { city: 'Málaga', state: 'Andalusien', country: 'Spanien' },
      },
    ])
    expect(place.area).toBe('Málaga, Spanien')
  })

  it('leaves out the town when the place is the town itself', () => {
    const [place] = mapNominatimResults([
      {
        place_id: 2,
        display_name: 'København, Region Hovedstaden, Danmark',
        lat: '55.68',
        lon: '12.57',
        address: { city: 'København', country: 'Danmark' },
      },
    ])
    expect(place.area).toBe('Danmark')
  })

  it('has no area for a country, or without address details', () => {
    const [country, bare] = mapNominatimResults([
      {
        place_id: 3,
        display_name: 'Danmark',
        lat: '56',
        lon: '10',
        address: { country: 'Danmark' },
      },
      { place_id: 4, display_name: 'Rom, Lazio, Italien', lat: '41.9', lon: '12.5' },
    ])
    expect(country).not.toHaveProperty('area')
    expect(bare).not.toHaveProperty('area')
  })

  it('returns an empty list for no results', () => {
    expect(mapNominatimResults([])).toEqual([])
  })
})
