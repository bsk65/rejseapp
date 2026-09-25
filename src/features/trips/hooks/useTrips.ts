import { useEffect, useState } from 'react'
import { subscribeToTrips } from '../repository'
import type { Trip } from '../types'

export function useTrips(ownerUid: string | null) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ownerUid) return
    return subscribeToTrips(ownerUid, (nextTrips) => {
      setTrips(nextTrips)
      setLoading(false)
    })
  }, [ownerUid])

  if (!ownerUid) {
    return { trips: [], loading: false }
  }

  return { trips, loading }
}
