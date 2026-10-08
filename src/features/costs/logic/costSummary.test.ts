import { describe, expect, it } from 'vitest'
import type { DkkRates } from '../../../shared/utils/money'
import type { CostSource } from '../types'
import { buildCostSummary, needsRates } from './costSummary'

const rates: DkkRates = { date: '2026-10-08', perDkk: { eur: 0.134, idr: 2500 } }

const sources: CostSource[] = [
  {
    key: 'fly-ud',
    category: 'transport',
    label: 'AF1265',
    date: '2026-12-20',
    price: { amount: 4200, currency: 'DKK', dkk: 4200 },
  },
  {
    key: 'fly-hjem',
    category: 'transport',
    label: 'AF1762',
    date: '2026-12-10',
    price: { amount: 300, currency: 'EUR', dkk: 2238.81, rateDate: '2026-10-01' },
  },
  {
    key: 'hotel',
    category: 'stays',
    label: 'Hotel Bali',
    date: '2026-12-21',
    price: { amount: 3200000, currency: 'IDR' },
  },
  { key: 'tog', category: 'transport', label: 'Tog', date: '2026-12-22' },
  { key: 'middag', category: 'restaurant', label: 'Middag', price: { amount: 5, currency: 'XYZ' } },
]

describe('buildCostSummary', () => {
  it('groups by category in fixed order, leaving out empty categories', () => {
    const summary = buildCostSummary(sources, rates)
    expect(summary.groups.map((group) => group.category)).toEqual([
      'transport',
      'stays',
      'restaurant',
    ])
  })

  it('sorts items by date within a category', () => {
    const transport = buildCostSummary(sources, rates).groups[0]
    expect(transport?.items.map((item) => item.key)).toEqual(['fly-hjem', 'fly-ud'])
  })

  it('uses the saved conversion, and today’s rate only when none was saved', () => {
    const summary = buildCostSummary(sources, rates)
    const transport = summary.groups[0]
    const stays = summary.groups[1]
    expect(transport?.totalDkk).toBe(6438.81)
    expect(transport?.items.every((item) => !item.todayRate)).toBe(true)
    expect(stays?.items[0]).toMatchObject({ dkk: 1280, todayRate: true })
  })

  it('sums the total, counting bookings without a price and amounts that cannot be converted', () => {
    const summary = buildCostSummary(sources, rates)
    expect(summary.totalDkk).toBe(7718.81)
    expect(summary.missingCount).toBe(1)
    expect(summary.unconvertedCount).toBe(1)
    expect(summary.hasForeign).toBe(true)
  })

  it('leaves unsaved foreign amounts out of the total without rates (offline)', () => {
    const summary = buildCostSummary(sources)
    expect(summary.totalDkk).toBe(6438.81)
    expect(summary.unconvertedCount).toBe(2)
  })

  it('is empty when nothing has a price', () => {
    const summary = buildCostSummary([{ key: 'a', category: 'other', label: 'A' }])
    expect(summary).toEqual({
      groups: [],
      totalDkk: 0,
      missingCount: 1,
      unconvertedCount: 0,
      hasForeign: false,
    })
  })
})

describe('needsRates', () => {
  it('is true only when a price lacks its conversion', () => {
    expect(needsRates(sources)).toBe(true)
    expect(needsRates(sources.slice(0, 2))).toBe(false)
  })
})
