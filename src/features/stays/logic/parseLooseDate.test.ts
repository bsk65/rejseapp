import { describe, expect, it } from 'vitest'
import { findDate, findTimes } from './parseLooseDate'

const REF = '2026-09-29'
const date = (text: string) => findDate(text, REF)?.date

describe('findDate', () => {
  it('reads ISO and numeric dates (day first)', () => {
    expect(date('2026-09-29')).toBe('2026-09-29')
    expect(date('29.09.2026')).toBe('2026-09-29')
    expect(date('2/10/26')).toBe('2026-10-02')
  })

  it('reads an American month/day date when it can only be that', () => {
    expect(date('09/29/2026')).toBe('2026-09-29')
  })

  it('reads Danish text dates, with and without year', () => {
    expect(date('tirsdag den 29. september 2026')).toBe('2026-09-29')
    expect(date('fre. 2. okt.')).toBe('2026-10-02')
  })

  it('reads English text dates', () => {
    expect(date('Tuesday, September 29, 2026')).toBe('2026-09-29')
    expect(date('Fri, Oct 2')).toBe('2026-10-02')
    expect(date('2 October 2026')).toBe('2026-10-02')
  })

  it('picks the nearest year when it is missing (around New Year)', () => {
    expect(findDate('3. jan.', '2026-12-28')?.date).toBe('2027-01-03')
  })

  it('returns nothing without a date', () => {
    expect(date('fra 15:00')).toBeUndefined()
  })
})

describe('findTimes', () => {
  it('reads 24-hour and AM/PM times', () => {
    expect(findTimes('fra 15:00')).toEqual(['15:00'])
    expect(findTimes('from 3:00 PM')).toEqual(['15:00'])
    expect(findTimes('until 11 AM')).toEqual(['11:00'])
    expect(findTimes('12:30 a.m.')).toEqual(['00:30'])
    expect(findTimes('kl. 14')).toEqual(['14:00'])
  })

  it('returns all times in a range', () => {
    expect(findTimes('(00:00 - 11:00)')).toEqual(['00:00', '11:00'])
  })
})
