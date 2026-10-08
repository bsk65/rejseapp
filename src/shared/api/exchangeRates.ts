import type { Price } from '../types/price'
import { samePrice, withDkk, type DkkRates } from '../utils/money'

/**
 * Dagens valutakurser fra den gratis, åbne "currency-api" (fawazahmed0) — ingen
 * nøgle, 200+ valutaer, opdateres dagligt. To adresser til samme data, så den
 * ene kan svigte. Der sendes ingen personoplysninger, kun et filopslag.
 */
const RATE_URLS = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/dkk.json',
  'https://latest.currency-api.pages.dev/v1/currencies/dkk.json',
]

type RatesResponse = { date?: string; dkk?: Record<string, number> }

// Hentes højst én gang pr. app-åbning (kurserne skifter kun dagligt).
let cached: Promise<DkkRates> | null = null

async function fetchFrom(url: string): Promise<DkkRates> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Kurser: HTTP ${response.status}`)
  const data = (await response.json()) as RatesResponse
  if (!data.date || !data.dkk) throw new Error('Kurser: uventet svar')
  return { date: data.date, perDkk: data.dkk }
}

export function fetchDkkRates(): Promise<DkkRates> {
  if (!cached) {
    cached = RATE_URLS.reduce<Promise<DkkRates>>(
      (attempt, url) => attempt.catch(() => fetchFrom(url)),
      Promise.reject(new Error('start')),
    )
    // En fejl (f.eks. offline) skal ikke huskes — næste forsøg prøver igen.
    cached.catch(() => {
      cached = null
    })
  }
  return cached
}

/**
 * Prisen klar til at gemme: omregnet til kroner med dagens kurs. Er beløb og
 * valuta uændrede, beholdes den gamle omregning. Kan kursen ikke hentes,
 * gemmes prisen uden kroner — oversigten regner den så om med dagens kurs.
 */
export async function priceForSave(
  price: Price | undefined,
  previous: Price | undefined,
): Promise<Price | undefined> {
  if (!price) return undefined
  if (samePrice(price, previous) && previous?.dkk !== undefined) return previous
  if (price.currency === 'DKK') return { amount: price.amount, currency: 'DKK', dkk: price.amount }
  try {
    return withDkk(price, await fetchDkkRates())
  } catch {
    return { amount: price.amount, currency: price.currency }
  }
}
