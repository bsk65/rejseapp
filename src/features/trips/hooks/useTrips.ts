import { useEffect, useState } from 'react'
import { subscribeToTrips } from '../repository'
import type { Trip } from '../types'

export function useTrips(memberUid: string | null) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!memberUid) return
    return subscribeToTrips(memberUid, (nextTrips) => {
      setTrips(nextTrips)
      setLoading(false)
    })
  }, [memberUid])

  if (!memberUid) {
    return { trips: [], loading: false }
  }

  return { trips, loading }
}
