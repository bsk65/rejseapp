import { describe, expect, it } from 'vitest'
import { mapAeroDataBoxFlights, normalizeFlightNumber } from './flightInfo'

// Forkortet svar i AeroDataBox' format.
const RESPONSE = [
  {
    number: 'SK 1415',
    airline: { name: 'SAS', iata: 'SK' },
    departure: {
      airport: {
        iata: 'CPH',
        name: 'Copenhagen',
        municipalityName: 'Copenhagen',
        location: { lat: 55.618, lon: 12.656 },
      },
      scheduledTime: { utc: '2026-10-03 05:40Z', local: '2026-10-03 07:40+02:00' },
      terminal: '3',
    },
    arrival: {
      airport: { iata: 'FCO', shortName: 'Fiumicino', location: { lat: 41.8, lon: 12.25 } },
      scheduledTimeLocal: '2026-10-03 10:05+02:00',
    },
  },
]

describe('mapAeroDataBoxFlights', () => {
  it('maps airports, local times and terminal', () => {
    expect(mapAeroDataBoxFlights(RESPONSE)).toEqual([
      {
        airline: 'SAS',
        number: 'SK 1415',
        departure: {
          iata: 'CPH',
          name: 'Copenhagen (CPH)',
          lat: 55.618,
          lng: 12.656,
          time: '2026-10-03T07:40',
          terminal: '3',
        },
        arrival: {
          iata: 'FCO',
          name: 'Fiumicino (FCO)',
          lat: 41.8,
          lng: 12.25,
          time: '2026-10-03T10:05',
          terminal: undefined,
        },
      },
    ])
  })

  it('returns an empty list for anything that is not a flight list', () => {
    expect(mapAeroDataBoxFlights({ message: 'Not found' })).toEqual([])
  })
})

describe('normalizeFlightNumber', () => {
  it('removes spaces and upper-cases', () => {
    expect(normalizeFlightNumber('sk 1415')).toBe('SK1415')
    expect(normalizeFlightNumber('U2 4567')).toBe('U24567')
  })

  it('rejects things that are not flight numbers', () => {
    expect(normalizeFlightNumber('København')).toBeUndefined()
    expect(normalizeFlightNumber('')).toBeUndefined()
  })
})
