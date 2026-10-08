import type { TextKey } from '../../shared/i18n/translator'
import type { Price } from '../../shared/types/price'

/** Kategorierne i "Rejsens pris" — vises i denne rækkefølge. */
export const COST_CATEGORIES = ['transport', 'stays', 'restaurant', 'activity', 'other'] as const
export type CostCategory = (typeof COST_CATEGORIES)[number]

export const costCategoryLabel: Record<CostCategory, TextKey> = {
  transport: 'costs.categoryTransport',
  stays: 'costs.categoryStays',
  restaurant: 'costs.categoryRestaurant',
  activity: 'costs.categoryActivity',
  other: 'costs.categoryOther',
}

export const costCategoryIcon: Record<CostCategory, string> = {
  transport: '✈️',
  stays: '🛏️',
  restaurant: '🍽️',
  activity: '🎟️',
  other: '📌',
}

/** Én booking, som den indgår i oversigten (med eller uden pris). */
export type CostSource = {
  key: string
  category: CostCategory
  label: string
  /** YYYY-MM-DD — til sortering og visning. */
  date?: string
  price?: Price
  /** Andre rejser, som prisen også dækker (navne), f.eks. hjemrejsens flyvninger. */
  includes?: string[]
}

export type CostItem = {
  key: string
  label: string
  date?: string
  price: Price
  /** Beløbet i kroner — mangler, hvis det ikke kunne omregnes. */
  dkk?: number
  /** Omregnet med dagens kurs nu, fordi der ikke blev gemt en kurs med prisen. */
  todayRate: boolean
  includes?: string[]
}

export type CostGroup = { category: CostCategory; items: CostItem[]; totalDkk: number }

export type CostSummary = {
  groups: CostGroup[]
  totalDkk: number
  /** Bookinger uden pris. */
  missingCount: number
  /** Priser, der ikke kunne omregnes til kroner (og derfor ikke er i totalen). */
  unconvertedCount: number
  /** Er der beløb i fremmed valuta? Så forklares omregningen. */
  hasForeign: boolean
}
