import { useState } from 'react'
import { deleteTripPhotos } from '../../photos/repository'
import { deleteTripTrack } from '../../tracking/repository'
import { deleteTripContent } from '../repository'

/** Sletter en rejse med alt dens indhold. Kun rejsens ejer må kalde den. */
export function useDeleteTrip() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deleteTrip(tripId: string, ownerUid: string): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      await Promise.all([deleteTripPhotos(tripId, ownerUid), deleteTripTrack(tripId, ownerUid)])
      await deleteTripContent(tripId, ownerUid)
      return true
    } catch {
      setError('Rejsen kunne ikke slettes helt. Prøv igen.')
      return false
    } finally {
      setPending(false)
    }
  }

  return { deleteTrip, pending, error }
}
