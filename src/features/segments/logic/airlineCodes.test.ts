import { describe, expect, it } from 'vitest'
import { airlineCode, withAirlineCode } from './airlineCodes'

describe('airlineCode', () => {
  it('finds the code from the airline name, ignoring case and spaces', () => {
    expect(airlineCode('Air France ')).toBe('AF')
    expect(airlineCode('airfrance')).toBe('AF')
    expect(airlineCode('SAS')).toBe('SK')
    expect(airlineCode('Widerøe')).toBe('WF')
  })

  it('accepts the code itself', () => {
    expect(airlineCode('af')).toBe('AF')
  })

  it('returns nothing for unknown or empty airlines', () => {
    expect(airlineCode('Luftfartsselskabet Nord')).toBeUndefined()
    expect(airlineCode('')).toBeUndefined()
  })
})

describe('withAirlineCode', () => {
  it('adds the code in front of a number-only flight number', () => {
    expect(withAirlineCode('1762', 'Air France')).toBe('AF1762')
    expect(withAirlineCode(' 1415 ', 'SAS')).toBe('SK1415')
  })

  it('leaves a flight number that already has a code alone', () => {
    expect(withAirlineCode('AF1762', 'Air France')).toBe('AF1762')
    expect(withAirlineCode('KL1126', 'Air France')).toBe('KL1126')
  })

  it('leaves the number alone when the airline is unknown', () => {
    expect(withAirlineCode('1762', undefined)).toBe('1762')
    expect(withAirlineCode('1762', 'Ukendt Air')).toBe('1762')
  })

  it('handles an empty number', () => {
    expect(withAirlineCode('', 'Air France')).toBeUndefined()
  })
})
