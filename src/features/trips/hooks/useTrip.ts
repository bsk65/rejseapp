import { useEffect, useState } from 'react'
import { subscribeToTrip } from '../repository'
import type { Trip } from '../types'

export function useTrip(tripId: string | undefined) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) return
    return subscribeToTrip(tripId, (nextTrip) => {
      setTrip(nextTrip)
      setLoading(false)
    })
  }, [tripId])

  if (!tripId) {
    return { trip: null, loading: false }
  }

  return { trip, loading }
}
