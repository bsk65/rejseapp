import { describe, expect, it } from 'vitest'
import { dayColorIndex } from './dayColors'

describe('dayColorIndex', () => {
  it('starts at 0 for day 1 and repeats after 8 days', () => {
    expect(dayColorIndex(1)).toBe(0)
    expect(dayColorIndex(8)).toBe(7)
    expect(dayColorIndex(9)).toBe(0)
  })
})
