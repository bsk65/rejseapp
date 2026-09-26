import { useEffect, useState } from 'react'
import { subscribeToDays } from '../repository'
import type { Day } from '../types'

export function useDays(tripId: string | undefined, memberUid: string | undefined) {
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId || !memberUid) return
    return subscribeToDays(tripId, memberUid, (nextDays) => {
      setDays(nextDays)
      setLoading(false)
    })
  }, [tripId, memberUid])

  if (!tripId || !memberUid) {
    return { days: [], loading: false }
  }

  return { days, loading }
}
