import { describe, expect, it } from 'vitest'
import { parseDestinationNames, toPlaceholderPlace } from './destinations'

describe('parseDestinationNames', () => {
  it('splits on commas and trims whitespace', () => {
    expect(parseDestinationNames('Rom,  Firenze ,Venedig')).toEqual(['Rom', 'Firenze', 'Venedig'])
  })

  it('drops empty entries', () => {
    expect(parseDestinationNames('Rom,, ,Venedig')).toEqual(['Rom', 'Venedig'])
  })

  it('returns an empty list for blank input', () => {
    expect(parseDestinationNames('   ')).toEqual([])
  })
})

describe('toPlaceholderPlace', () => {
  it('builds a deterministic placeId from the name', () => {
    expect(toPlaceholderPlace('Firenze Centrale')).toEqual({
      name: 'Firenze Centrale',
      lat: 0,
      lng: 0,
      placeId: 'manual:firenze-centrale',
    })
  })
})
