import { describe, expect, it } from 'vitest'
import { dayOfYearToIsoDate, parseBoardingPass } from './parseBoardingPass'

// Opbygget efter IATA BCBP-standarden: 1 strækning, CPH → FCO med SK1415 på
// dag 276 (3. okt. 2026), sæde 14C, variabelt felt på 0x18 = 24 tegn.
const ONE_LEG =
  'M1KLAUSEN/BJARNE MR   EX7K2PQ CPHFCOSK 01415276Y014C0042 118>5180  6275BSK 00000000000000'

// To strækninger: CPH → FRA (LH 829) og FRA → LIS (LH1166), ingen variable data.
const TWO_LEGS =
  'M2HANSEN/ANNE         EABC123 CPHFRALH 00829276M012A0001 100' +
  'ABC123 FRALISLH 01166276M031F0002 100'

describe('parseBoardingPass', () => {
  it('reads the mandatory fields of a single-leg pass', () => {
    const pass = parseBoardingPass(ONE_LEG)
    expect(pass.passengerName).toBe('KLAUSEN/BJARNE MR')
    expect(pass.legs).toEqual([
      {
        bookingRef: 'X7K2PQ',
        fromAirport: 'CPH',
        toAirport: 'FCO',
        carrier: 'SK',
        flightNumber: '1415',
        dayOfYear: 276,
        seat: '14C',
      },
    ])
  })

  it('reads every leg of a connecting itinerary', () => {
    const pass = parseBoardingPass(TWO_LEGS)
    expect(
      pass.legs.map((leg) => [leg.fromAirport, leg.toAirport, leg.flightNumber, leg.seat]),
    ).toEqual([
      ['CPH', 'FRA', '829', '12A'],
      ['FRA', 'LIS', '1166', '31F'],
    ])
  })

  it('rejects text that is not a boarding pass', () => {
    expect(() => parseBoardingPass('https://example.com')).toThrow('ikke et boardingkort')
  })
})

describe('dayOfYearToIsoDate', () => {
  it('converts a day of the year to a date near the reference', () => {
    expect(dayOfYearToIsoDate(276, new Date('2026-09-27'))).toBe('2026-10-03')
  })

  it('picks next year when the flight is just after new year', () => {
    expect(dayOfYearToIsoDate(3, new Date('2026-12-28'))).toBe('2027-01-03')
  })
})
