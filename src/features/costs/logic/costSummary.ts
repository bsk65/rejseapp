import { toDkk, type DkkRates } from '../../../shared/utils/money'
import {
  COST_CATEGORIES,
  type CostGroup,
  type CostItem,
  type CostSource,
  type CostSummary,
} from '../types'

const roundOre = (value: number) => Math.round(value * 100) / 100

/** Skal der hentes dagens kurs? Kun hvis en pris i fremmed valuta mangler sin omregning. */
export function needsRates(sources: CostSource[]): boolean {
  return sources.some((source) => source.price && source.price.dkk === undefined)
}

function toItem(
  source: CostSource & { price: NonNullable<CostSource['price']> },
  rates?: DkkRates,
): CostItem {
  const { price } = source
  const saved = price.dkk
  const live = saved === undefined && rates ? toDkk(price.amount, price.currency, rates) : undefined
  return {
    key: source.key,
    label: source.label,
    date: source.date,
    price,
    dkk: saved ?? live,
    todayRate: live !== undefined,
  }
}

/**
 * Samler bookingernes priser pr. kategori med subtotal og samlet total i
 * kroner. Bookinger uden pris tælles kun (missingCount); priser, der ikke kan
 * omregnes (ukendt valuta, ingen kurs offline), vises men er ikke i totalen.
 */
export function buildCostSummary(sources: CostSource[], rates?: DkkRates): CostSummary {
  const priced = sources.filter(
    (source): source is CostSource & { price: NonNullable<CostSource['price']> } => !!source.price,
  )
  const items = priced.map((source) => ({ category: source.category, item: toItem(source, rates) }))

  const groups: CostGroup[] = COST_CATEGORIES.map((category) => {
    const groupItems = items
      .filter((entry) => entry.category === category)
      .map((entry) => entry.item)
      .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
    const totalDkk = roundOre(groupItems.reduce((sum, item) => sum + (item.dkk ?? 0), 0))
    return { category, items: groupItems, totalDkk }
  }).filter((group) => group.items.length > 0)

  return {
    groups,
    totalDkk: roundOre(groups.reduce((sum, group) => sum + group.totalDkk, 0)),
    missingCount: sources.length - priced.length,
    unconvertedCount: items.filter((entry) => entry.item.dkk === undefined).length,
    hasForeign: priced.some((source) => source.price.currency !== 'DKK'),
  }
}
