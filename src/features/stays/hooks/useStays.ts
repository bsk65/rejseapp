import { useEffect, useState } from 'react'
import { subscribeToStays } from '../repository'
import type { Stay } from '../types'

export function useStays(tripId: string | undefined, memberUid: string | undefined) {
  const [stays, setStays] = useState<Stay[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId || !memberUid) return
    return subscribeToStays(
      tripId,
      memberUid,
      (next) => {
        setStays(next)
        setError(null)
      },
      (err) => setError('Kunne ikke hente overnatninger: ' + err.message),
    )
  }, [tripId, memberUid])

  if (!tripId || !memberUid) {
    return { stays: [], error: null }
  }

  return { stays, error }
}
