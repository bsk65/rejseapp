import { describe, expect, it } from 'vitest'
import { TextError } from '../../../shared/i18n/message'
import { legForFlight } from './legForFlight'
import type { BoardingPass, BoardingPassLeg } from './parseBoardingPass'

function leg(carrier: string, flightNumber: string): BoardingPassLeg {
  return {
    bookingRef: 'X7K2PQ',
    fromAirport: 'CPH',
    toAirport: 'FCO',
    carrier,
    flightNumber,
    dayOfYear: 276,
  }
}

const ONE: BoardingPass = { passengerName: 'KLAUSEN/BJARNE', legs: [leg('SK', '1415')] }
const TWO: BoardingPass = {
  passengerName: 'KLAUSEN/BJARNE',
  legs: [leg('AF', '1265'), leg('AF', '1762')],
}

function errorKey(fn: () => unknown): string | undefined {
  try {
    fn()
  } catch (err) {
    return err instanceof TextError ? err.key : undefined
  }
  return undefined
}

describe('legForFlight', () => {
  it('finder strækningen med flyets nummer, uanset mellemrum og nuller', () => {
    expect(legForFlight(TWO, 'AF 1762').flightNumber).toBe('1762')
    expect(legForFlight(ONE, 'sk01415').flightNumber).toBe('1415')
  })

  it('bruger kortets eneste strækning, hvis flyet ikke har et nummer', () => {
    expect(legForFlight(ONE, undefined).flightNumber).toBe('1415')
  })

  it('afviser et kort til et andet fly', () => {
    expect(errorKey(() => legForFlight(ONE, 'SK1416'))).toBe('segments.passWrongFlight')
  })

  it('beder om flynummer, når kortet har flere strækninger', () => {
    expect(errorKey(() => legForFlight(TWO, undefined))).toBe('segments.passPickFlight')
  })
})
