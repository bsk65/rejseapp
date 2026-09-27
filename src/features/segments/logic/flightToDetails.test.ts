import { describe, expect, it } from 'vitest'
import type { FlightInfo } from '../api/flightLookup'
import { compactFlightNumber, flightToSegmentDetails, pickFlight } from './flightToDetails'

const CPH_FCO: FlightInfo = {
  airline: 'SAS',
  number: 'SK 1415',
  departure: {
    iata: 'CPH',
    name: 'Copenhagen (CPH)',
    lat: 55.6,
    lng: 12.6,
    time: '2026-10-03T07:40',
    terminal: '3',
  },
  arrival: { iata: 'FCO', name: 'Fiumicino (FCO)', lat: 41.8, lng: 12.2, time: '2026-10-03T10:05' },
}

describe('flightToSegmentDetails', () => {
  it('fills carrier, number, airports, times and terminal', () => {
    expect(flightToSegmentDetails(CPH_FCO)).toEqual({
      carrier: 'SAS',
      number: 'SK 1415',
      departurePlace: { name: 'Copenhagen (CPH)', lat: 55.6, lng: 12.6, placeId: 'iata:CPH' },
      departureTime: '2026-10-03T07:40',
      terminal: '3',
      arrivalPlace: { name: 'Fiumicino (FCO)', lat: 41.8, lng: 12.2, placeId: 'iata:FCO' },
      arrivalTime: '2026-10-03T10:05',
    })
  })

  it('leaves out an airport without coordinates instead of guessing', () => {
    const details = flightToSegmentDetails({
      ...CPH_FCO,
      arrival: { iata: 'FCO', name: 'Fiumicino (FCO)' },
    })
    expect(details.arrivalPlace).toBeUndefined()
    expect('arrivalTime' in details).toBe(false)
  })
})

describe('pickFlight', () => {
  const second: FlightInfo = { ...CPH_FCO, departure: { ...CPH_FCO.departure, iata: 'FRA' } }

  it('prefers the leg departing from the known airport', () => {
    expect(pickFlight([CPH_FCO, second], 'FRA')).toBe(second)
  })

  it('falls back to the first leg', () => {
    expect(pickFlight([CPH_FCO, second])).toBe(CPH_FCO)
    expect(pickFlight([])).toBeUndefined()
  })
})

describe('compactFlightNumber', () => {
  it('normalises spacing, case and leading zeros', () => {
    expect(compactFlightNumber('SK 1415')).toBe('SK1415')
    expect(compactFlightNumber('sk01415')).toBe('SK1415')
    expect(compactFlightNumber(undefined)).toBe('')
  })
})
