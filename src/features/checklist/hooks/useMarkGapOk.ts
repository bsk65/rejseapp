import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { updateDayChecksOk } from '../../days/repository'
import type { Day } from '../../days/types'
import { okKeyOf, toggleOkKey } from '../logic/okKey'
import type { Gap } from '../types'

/** Markér et hul som "Det er OK" på dagen — eller fortryd det. */
export function useMarkGapOk(tripId: string) {
  const [error, setError] = useState<TextKey | null>(null)

  async function setOk(day: Day, gap: Gap, ok: boolean) {
    const key = okKeyOf(gap)
    if (!key) return
    setError(null)
    try {
      await updateDayChecksOk(tripId, day.id, toggleOkKey(day.checksOk ?? [], key, ok))
    } catch {
      setError('checklist.saveError')
    }
  }

  return { setOk, error }
}
