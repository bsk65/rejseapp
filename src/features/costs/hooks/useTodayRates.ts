import { useEffect, useState } from 'react'
import { fetchDkkRates } from '../../../shared/api/exchangeRates'
import type { DkkRates } from '../../../shared/utils/money'

/**
 * Dagens kurser — kun hentet, når der er brug for dem (en pris i fremmed
 * valuta blev gemt uden omregning, f.eks. offline). Fejler det, er de undefined.
 */
export function useTodayRates(needed: boolean): DkkRates | undefined {
  const [rates, setRates] = useState<DkkRates | undefined>(undefined)

  useEffect(() => {
    if (!needed) return
    let cancelled = false
    fetchDkkRates()
      .then((fetched) => {
        if (!cancelled) setRates(fetched)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [needed])

  return rates
}
