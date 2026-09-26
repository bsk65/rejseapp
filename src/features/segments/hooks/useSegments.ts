import { useEffect, useState } from 'react'
import { subscribeToSegments } from '../repository'
import type { Segment } from '../types'

export function useSegments(tripId: string, dayId: string, ownerUid: string) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeToSegments(tripId, dayId, ownerUid, (nextSegments) => {
      setSegments(nextSegments)
      setLoading(false)
    })
  }, [tripId, dayId, ownerUid])

  return { segments, loading }
}
