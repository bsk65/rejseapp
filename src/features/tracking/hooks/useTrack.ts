import { useEffect, useState } from 'react'
import { subscribeToTrack } from '../repository'
import type { TrackPoint } from '../types'

export function useTrack(tripId: string | undefined, viewerUid: string | undefined) {
  const [points, setPoints] = useState<TrackPoint[]>([])

  useEffect(() => {
    if (!tripId || !viewerUid) return
    return subscribeToTrack(tripId, viewerUid, setPoints)
  }, [tripId, viewerUid])

  if (!tripId || !viewerUid) {
    return { points: [] }
  }

  return { points }
}
