import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { createReservation, deleteReservation, updateReservation } from '../repository'
import type { ReservationDetails } from '../types'

/** Opret, gem og slet reservationer — med fælles pending/fejl-tilstand til formularen. */
export function useSaveReservation(tripId: string) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<TextKey | null>(null)

  async function run(action: () => Promise<void>): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      await action()
      return true
    } catch {
      setError('reservations.errorSave')
      return false
    } finally {
      setPending(false)
    }
  }

  return {
    pending,
    error,
    create: (creatorUid: string, memberUids: string[], details: ReservationDetails) =>
      run(() => createReservation(tripId, creatorUid, memberUids, details)),
    update: (reservationId: string, details: ReservationDetails) =>
      run(() => updateReservation(tripId, reservationId, details)),
    remove: (reservationId: string) => run(() => deleteReservation(tripId, reservationId)),
  }
}
