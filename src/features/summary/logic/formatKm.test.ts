import { describe, expect, it } from 'vitest'
import { formatKm } from './formatKm'

describe('formatKm', () => {
  it('shows one decimal under 10 km', () => {
    expect(formatKm(0.84)).toBe('0,8 km')
  })

  it('rounds longer distances with a thousands separator', () => {
    expect(formatKm(12.4)).toBe('12 km')
    expect(formatKm(1234.5)).toBe('1.235 km')
  })
})
