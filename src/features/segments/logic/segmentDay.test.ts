import { describe, expect, it } from 'vitest'
import { dayIdForDeparture } from './segmentDay'

const days = [
  { id: 'd1', date: '2026-12-27' },
  { id: 'd2', date: '2026-12-28' },
]

describe('dayIdForDeparture', () => {
  it('flytter til dagen med afgangsdatoen', () => {
    expect(dayIdForDeparture('2026-12-28T01:40', days, 'd1')).toBe('d2')
  })
  it('bliver på samme dag, når datoen passer', () => {
    expect(dayIdForDeparture('2026-12-27T10:00', days, 'd1')).toBe('d1')
  })
  it('bliver, når der kun er et klokkeslæt eller ingen tid', () => {
    expect(dayIdForDeparture('10:00', days, 'd1')).toBe('d1')
    expect(dayIdForDeparture(undefined, days, 'd1')).toBe('d1')
  })
  it('bliver, når datoen ligger uden for rejsen', () => {
    expect(dayIdForDeparture('2027-01-15T10:00', days, 'd1')).toBe('d1')
  })
})
