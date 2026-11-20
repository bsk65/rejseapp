import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { updateDayChecksOk } from '../../days/repository'
import type { Day } from '../../days/types'
import type { OkKind } from '../types'

/** Markér et hul som "Det er OK" på dagen — eller fortryd det. */
export function useMarkGapOk(tripId: string) {
  const [error, setError] = useState<TextKey | null>(null)

  async function setOk(day: Day, kind: OkKind, ok: boolean) {
    setError(null)
    const current = day.checksOk ?? []
    const next = ok ? [...new Set([...current, kind])] : current.filter((k) => k !== kind)
    try {
      await updateDayChecksOk(tripId, day.id, next)
    } catch {
      setError('checklist.saveError')
    }
  }

  return { setOk, error }
}
