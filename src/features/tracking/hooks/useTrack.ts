import { useEffect, useState } from 'react'
import type { Message } from '../../../shared/i18n/message'
import { subscribeToTrack } from '../repository'
import type { TrackPoint } from '../types'

export function useTrack(tripId: string | undefined, viewerUid: string | undefined) {
  const [points, setPoints] = useState<TrackPoint[]>([])
  const [error, setError] = useState<Message | null>(null)

  useEffect(() => {
    if (!tripId || !viewerUid) return
    return subscribeToTrack(
      tripId,
      viewerUid,
      (next) => {
        setPoints(next)
        setError(null)
      },
      (err) => {
        console.error('Kunne ikke hente sporet', err)
        setError({ key: 'tracking.errorLoadTrack' })
      },
    )
  }, [tripId, viewerUid])

  if (!tripId || !viewerUid) {
    return { points: [], error: null }
  }

  return { points, error }
}
