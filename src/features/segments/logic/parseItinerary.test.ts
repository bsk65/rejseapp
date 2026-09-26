import { describe, expect, it } from 'vitest'
import {
  extractAirportPair,
  extractBookingRef,
  extractCarrier,
  extractDates,
  extractFlightNumber,
  extractTimes,
  parseFlightItinerary,
} from './parseItinerary'

describe('extractFlightNumber', () => {
  it('finds a flight number like SK1457', () => {
    expect(extractFlightNumber('Dit fly SK1457 afgår kl. 14:30')).toBe('SK1457')
  })

  it('returns undefined when there is no flight number', () => {
    expect(extractFlightNumber('Ingen relevante oplysninger her')).toBeUndefined()
  })
})

describe('extractAirportPair', () => {
  it('finds a dash-separated pair', () => {
    expect(extractAirportPair('Rute: CPH-JFK')).toEqual({ from: 'CPH', to: 'JFK' })
  })

  it('finds an arrow-separated pair', () => {
    expect(extractAirportPair('CPH → JFK')).toEqual({ from: 'CPH', to: 'JFK' })
  })

  it('finds a "til"-separated pair', () => {
    expect(extractAirportPair('Fra CPH til JFK')).toEqual({ from: 'CPH', to: 'JFK' })
  })

  it('returns an empty object when no pair is found', () => {
    expect(extractAirportPair('Ingen lufthavne nævnt')).toEqual({})
  })
})

describe('extractDates', () => {
  it('normalizes numeric dd-mm-yyyy dates', () => {
    expect(extractDates('Afrejse 01-06-2026')).toEqual(['2026-06-01'])
  })

  it('normalizes two-digit years to 20xx', () => {
    expect(extractDates('Afrejse 01.06.26')).toEqual(['2026-06-01'])
  })

  it('keeps ISO dates unchanged', () => {
    expect(extractDates('Dato: 2026-06-01')).toEqual(['2026-06-01'])
  })
})

describe('extractTimes', () => {
  it('finds all HH:MM occurrences in order', () => {
    expect(extractTimes('Afgang 14:30, ankomst 16:45')).toEqual(['14:30', '16:45'])
  })
})

describe('extractBookingRef', () => {
  it('finds a booking reference after "Bookingreference:"', () => {
    expect(extractBookingRef('Bookingreference: AB12345')).toBe('AB12345')
  })

  it('finds a PNR code', () => {
    expect(extractBookingRef('PNR: XY123Z')).toBe('XY123Z')
  })

  it('returns undefined when no reference is present', () => {
    expect(extractBookingRef('Ingen reference her')).toBeUndefined()
  })
})

describe('extractCarrier', () => {
  it('matches a known carrier case-insensitively', () => {
    expect(extractCarrier('Booket med sas.dk')).toBe('SAS')
  })

  it('returns undefined for an unknown carrier', () => {
    expect(extractCarrier('Et helt ukendt selskab')).toBeUndefined()
  })
})

describe('parseFlightItinerary', () => {
  it('combines all extracted fields from a realistic confirmation email', () => {
    const email = `
      Din booking hos SAS er bekræftet.
      Fly SK1457
      Rute: CPH → JFK
      Afgang: 01-06-2026 14:30
      Ankomst: 01-06-2026 16:45
      Bookingreference: AB12345
    `
    expect(parseFlightItinerary(email)).toEqual({
      carrier: 'SAS',
      number: 'SK1457',
      departureAirport: 'CPH',
      arrivalAirport: 'JFK',
      departureTime: '2026-06-01T14:30',
      arrivalTime: '2026-06-01T16:45',
      bookingRef: 'AB12345',
    })
  })

  it('leaves fields undefined when nothing matches', () => {
    expect(parseFlightItinerary('Ingen relevante oplysninger')).toEqual({
      carrier: undefined,
      number: undefined,
      departureAirport: undefined,
      arrivalAirport: undefined,
      departureTime: undefined,
      arrivalTime: undefined,
      bookingRef: undefined,
    })
  })
})
