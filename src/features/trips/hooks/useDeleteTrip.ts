import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { deleteTripPhotos } from '../../photos/repository'
import { deleteTripTrack } from '../../tracking/repository'
import { deleteTripContent } from '../repository'

/** Sletter en rejse med alt dens indhold. Kun rejsens ejer må kalde den. */
export function useDeleteTrip() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<TextKey | null>(null)

  async function deleteTrip(tripId: string, ownerUid: string): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      await Promise.all([deleteTripPhotos(tripId, ownerUid), deleteTripTrack(tripId, ownerUid)])
      await deleteTripContent(tripId, ownerUid)
      return true
    } catch {
      setError('trips.errorDelete')
      return false
    } finally {
      setPending(false)
    }
  }

  return { deleteTrip, pending, error }
}
