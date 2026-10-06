import { useEffect, useState } from 'react'
import { subscribeToSegments } from '../repository'
import { sortByDeparture } from '../logic/sortByDeparture'
import type { Segment } from '../types'

export function useSegments(tripId: string, dayId: string, memberUid: string) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return subscribeToSegments(tripId, dayId, memberUid, (nextSegments) => {
      setSegments(sortByDeparture(nextSegments))
      setLoading(false)
    })
  }, [tripId, dayId, memberUid])

  return { segments, loading }
}
