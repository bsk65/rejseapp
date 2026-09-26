import { useState } from 'react'
import { deletePhoto } from '../repository'

export function useDeletePhoto() {
  const [pending, setPending] = useState(false)

  async function remove(tripId: string, photoId: string, storagePath: string): Promise<void> {
    setPending(true)
    try {
      await deletePhoto(tripId, photoId, storagePath)
    } finally {
      setPending(false)
    }
  }

  return { remove, pending }
}
