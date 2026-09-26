import { useEffect, useState } from 'react'
import { subscribeToDays } from '../repository'
import type { Day } from '../types'

export function useDays(tripId: string | undefined, ownerUid: string | undefined) {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId || !ownerUid) return
    return subscribeToDays(tripId, ownerUid, (nextDays) => {
      setDays(nextDays)
      setLoading(false)
    })
  }, [tripId, ownerUid])

  if (!tripId || !ownerUid) {
    return { days: [], loading: false }
  }

  return { days, loading }
}
