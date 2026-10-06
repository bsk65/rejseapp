import { describe, expect, it } from 'vitest'
import type { Reservation } from '../types'
import { reservationAt, reservationsForDate } from './reservationDates'

function reservation(id: string, date: string, time?: string): Reservation {
  return { id, kind: 'restaurant', name: id, date, time, ownerUid: 'u', memberUids: ['u'] }
}

describe('reservationsForDate', () => {
  it('giver kun dagens reservationer, efter klokkeslæt og uden tid sidst', () => {
    const all = [
      reservation('aften', '2027-01-02', '19:30'),
      reservation('udentid', '2027-01-02'),
      reservation('andendag', '2027-01-03', '08:00'),
      reservation('morgen', '2027-01-02', '09:00'),
    ]
    expect(reservationsForDate(all, '2027-01-02').map((r) => r.id)).toEqual([
      'morgen',
      'aften',
      'udentid',
    ])
  })
})

describe('reservationAt', () => {
  it('samler dato og tid, når tiden kendes', () => {
    expect(reservationAt(reservation('a', '2027-01-02', '19:30'))).toBe('2027-01-02T19:30')
    expect(reservationAt(reservation('a', '2027-01-02'))).toBeUndefined()
  })
})
