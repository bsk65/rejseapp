import { describe, expect, it } from 'vitest'
import { translatorFor } from '../../../shared/i18n/translator'
import { describeFlightDuration, flightDurationMinutes, formatDuration } from './flightDuration'

const da = translatorFor('da')

describe('flightDurationMinutes', () => {
  it('uses the time zones, not just the clock times', () => {
    // Billund 10:00 (+02:00) → London 11:00 (+01:00) = 2 timer, ikke 1.
    expect(
      flightDurationMinutes({
        departureTime: '2026-10-03T10:00',
        departureUtcOffset: '+02:00',
        arrivalTime: '2026-10-03T11:00',
        arrivalUtcOffset: '+01:00',
      }),
    ).toBe(120)
  })

  it('handles flights that land on another date', () => {
    // Istanbul 21:40 (+03:00) → Jakarta 13:55 næste dag (+07:00) = 12 t 15 min.
    expect(
      flightDurationMinutes({
        departureTime: '2026-12-28T21:40',
        departureUtcOffset: '+03:00',
        arrivalTime: '2026-12-29T13:55',
        arrivalUtcOffset: '+07:00',
      }),
    ).toBe(735)
  })

  it('is unknown without both time zones, or when arrival is not after departure', () => {
    expect(
      flightDurationMinutes({ departureTime: '2026-10-03T10:00', arrivalTime: '2026-10-03T11:00' }),
    ).toBeUndefined()
    expect(
      flightDurationMinutes({
        departureTime: '2026-10-03T10:00',
        departureUtcOffset: '+02:00',
        arrivalTime: '2026-10-03T09:00',
        arrivalUtcOffset: '+02:00',
      }),
    ).toBeUndefined()
  })
})

describe('formatDuration', () => {
  it('writes hours and minutes in Danish', () => {
    expect(formatDuration(125, da)).toBe('2 t 5 min')
    expect(formatDuration(120, da)).toBe('2 t')
    expect(formatDuration(45, da)).toBe('45 min')
  })

  it('writes hours and minutes in English', () => {
    expect(formatDuration(125, translatorFor('en'))).toBe('2 h 5 min')
  })
})

describe('describeFlightDuration', () => {
  it('labels the duration', () => {
    expect(
      describeFlightDuration(
        {
          departureTime: '2026-10-03T07:40',
          departureUtcOffset: '+02:00',
          arrivalTime: '2026-10-03T10:05',
          arrivalUtcOffset: '+02:00',
        },
        da,
      ),
    ).toBe('flyvetid 2 t 25 min')
  })
})
