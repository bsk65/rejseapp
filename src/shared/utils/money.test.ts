import { describe, expect, it } from 'vitest'
import { formatMoney, parseAmount, samePrice, toDkk, withDkk, type DkkRates } from './money'

const rates: DkkRates = { date: '2026-10-08', perDkk: { eur: 0.134, idr: 2500 } }

describe('parseAmount', () => {
  it('reads Danish notation with thousands separator and decimals', () => {
    expect(parseAmount('1.234,50')).toBe(1234.5)
  })

  it('reads English notation', () => {
    expect(parseAmount('1,234.50')).toBe(1234.5)
  })

  it('reads a plain decimal with a point', () => {
    expect(parseAmount('99.9')).toBe(99.9)
  })

  it('treats a group of three digits after a point as thousands', () => {
    expect(parseAmount('3.200.000')).toBe(3200000)
    expect(parseAmount('1.500')).toBe(1500)
  })

  it('ignores spaces between thousands', () => {
    expect(parseAmount('3 200 000')).toBe(3200000)
  })

  it('rejects empty and non-numeric input', () => {
    expect(parseAmount('')).toBeUndefined()
    expect(parseAmount('abc')).toBeUndefined()
    expect(parseAmount('-5')).toBeUndefined()
  })
})

describe('toDkk', () => {
  it('keeps kroner unchanged', () => {
    expect(toDkk(500, 'DKK', rates)).toBe(500)
  })

  it('converts a foreign amount, rounded to øre', () => {
    expect(toDkk(100, 'EUR', rates)).toBe(746.27)
    expect(toDkk(3200000, 'IDR', rates)).toBe(1280)
  })

  it('gives undefined for an unknown currency', () => {
    expect(toDkk(10, 'XYZ', rates)).toBeUndefined()
  })
})

describe('withDkk', () => {
  it('adds the converted amount and the rate date', () => {
    expect(withDkk({ amount: 3200000, currency: 'IDR' }, rates)).toEqual({
      amount: 3200000,
      currency: 'IDR',
      dkk: 1280,
      rateDate: '2026-10-08',
    })
  })

  it('needs no rate date for kroner', () => {
    expect(withDkk({ amount: 500, currency: 'DKK' }, rates)).toEqual({
      amount: 500,
      currency: 'DKK',
      dkk: 500,
    })
  })

  it('leaves out dkk when the currency is unknown', () => {
    expect(withDkk({ amount: 10, currency: 'XYZ', dkk: 3 }, rates)).toEqual({
      amount: 10,
      currency: 'XYZ',
    })
  })
})

describe('samePrice', () => {
  it('compares amount and currency only', () => {
    expect(samePrice({ amount: 5, currency: 'EUR', dkk: 37 }, { amount: 5, currency: 'EUR' })).toBe(
      true,
    )
    expect(samePrice({ amount: 5, currency: 'EUR' }, { amount: 5, currency: 'USD' })).toBe(false)
    expect(samePrice(undefined, { amount: 5, currency: 'EUR' })).toBe(false)
  })
})

describe('formatMoney', () => {
  it('formats kroner in Danish', () => {
    expect(formatMoney(1234.5, 'DKK', 'da-DK').replace(/\s/g, ' ')).toBe('1.235 kr.')
  })

  it('falls back to the code for an unknown currency', () => {
    expect(formatMoney(10, 'XYZ1', 'da-DK')).toBe('10 XYZ1')
  })
})
