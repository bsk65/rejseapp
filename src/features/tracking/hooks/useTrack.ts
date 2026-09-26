import { useEffect, useState } from 'react'
import { subscribeToTrack } from '../repository'
import type { TrackPoint } from '../types'

export function useTrack(tripId: string | undefined, viewerUid: string | undefined) {
  const [points, setPoints] = useState<TrackPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId || !viewerUid) return
    return subscribeToTrack(
      tripId,
      viewerUid,
      (next) => {
        setPoints(next)
        setError(null)
      },
      (err) => setError('Kunne ikke hente sporet: ' + err.message),
    )
  }, [tripId, viewerUid])

  if (!tripId || !viewerUid) {
    return { points: [], error: null }
  }

  return { points, error }
}
