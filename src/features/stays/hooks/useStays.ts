import { useEffect, useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { subscribeToStays } from '../repository'
import type { Stay } from '../types'

export function useStays(tripId: string | undefined, memberUid: string | undefined) {
  const [stays, setStays] = useState<Stay[]>([])
  const [error, setError] = useState<TextKey | null>(null)

  useEffect(() => {
    if (!tripId || !memberUid) return
    return subscribeToStays(
      tripId,
      memberUid,
      (next) => {
        setStays(next)
        setError(null)
      },
      (err) => {
        console.error('Kunne ikke hente overnatninger', err)
        setError('stays.errorLoad')
      },
    )
  }, [tripId, memberUid])

  if (!tripId || !memberUid) {
    return { stays: [], error: null }
  }

  return { stays, error }
}
