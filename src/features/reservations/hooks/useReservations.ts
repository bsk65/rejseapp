import { useEffect, useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { subscribeToReservations } from '../repository'
import type { Reservation } from '../types'

export function useReservations(tripId: string | undefined, memberUid: string | undefined) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [error, setError] = useState<TextKey | null>(null)

  useEffect(() => {
    if (!tripId || !memberUid) return
    return subscribeToReservations(
      tripId,
      memberUid,
      (next) => {
        setReservations(next)
        setError(null)
      },
      (err) => {
        console.error('Kunne ikke hente reservationer', err)
        setError('reservations.errorLoad')
      },
    )
  }, [tripId, memberUid])

  if (!tripId || !memberUid) {
    return { reservations: [], error: null }
  }

  return { reservations, error }
}
