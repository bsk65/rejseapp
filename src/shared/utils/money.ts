import type { Price } from '../types/price'

/** Valutaer i prisfeltets vælger — de mest almindelige rejsevalutaer, DKK først. */
export const CURRENCIES = [
  'DKK',
  'EUR',
  'SEK',
  'NOK',
  'GBP',
  'USD',
  'CHF',
  'PLN',
  'CZK',
  'HUF',
  'ISK',
  'TRY',
  'IDR',
  'THB',
  'VND',
  'MYR',
  'SGD',
  'PHP',
  'JPY',
  'KRW',
  'CNY',
  'HKD',
  'INR',
  'LKR',
  'AED',
  'EGP',
  'MAD',
  'ZAR',
  'KES',
  'TZS',
  'AUD',
  'NZD',
  'CAD',
  'MXN',
  'BRL',
] as const

/** Kurser som "1 DKK = x enheder" (nøgle med små bogstaver, som kurs-tjenesten giver dem). */
export type DkkRates = { date: string; perDkk: Record<string, number> }

/**
 * Læser et beløb, som det skrives på dansk eller engelsk: "1.234,50",
 * "1,234.50", "1234.5", "3 200 000". Det sidste skilletegn efterfulgt af 1-2
 * cifre er decimaltegnet; ellers er punktum/komma tusindtalsskilletegn.
 */
export function parseAmount(text: string): number | undefined {
  const cleaned = text.replace(/\s/g, '')
  if (!/^\d[\d.,]*$/.test(cleaned)) return undefined
  const decimal = cleaned.match(/[.,](\d{1,2})$/)
  const whole = decimal ? cleaned.slice(0, -decimal[0].length) : cleaned
  const digits = whole.replace(/[.,]/g, '')
  const value = Number(decimal ? `${digits}.${decimal[1]}` : digits)
  return Number.isFinite(value) ? value : undefined
}

/** Et beløb med valuta, f.eks. "1.234,50 kr." / "Rp 3.200.000" — afhænger af sproget. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: Math.abs(amount) >= 1000 ? 0 : 2,
    }).format(amount)
  } catch {
    // Ukendt valutakode — vis den bare efter tallet.
    return `${amount.toLocaleString(locale)} ${currency}`
  }
}

/** Beløbet i kroner ud fra kurserne — undefined, hvis valutaen ikke findes. */
export function toDkk(amount: number, currency: string, rates: DkkRates): number | undefined {
  if (currency === 'DKK') return amount
  const perDkk = rates.perDkk[currency.toLowerCase()]
  if (!perDkk || perDkk <= 0) return undefined
  return Math.round((amount / perDkk) * 100) / 100
}

/** Prisen med `dkk` (og kursdato) udfyldt — uændret, hvis valutaen ikke findes. */
export function withDkk(price: Price, rates: DkkRates): Price {
  if (price.currency === 'DKK') return { amount: price.amount, currency: 'DKK', dkk: price.amount }
  const dkk = toDkk(price.amount, price.currency, rates)
  if (dkk === undefined) return { amount: price.amount, currency: price.currency }
  return { amount: price.amount, currency: price.currency, dkk, rateDate: rates.date }
}

/** Er beløb og valuta de samme? Så kan den gamle omregning genbruges. */
export function samePrice(a: Price | undefined, b: Price | undefined): boolean {
  return !!a && !!b && a.amount === b.amount && a.currency === b.currency
}
