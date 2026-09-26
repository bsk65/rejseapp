import { useEffect, useState } from 'react'
import { subscribeToPhotos } from '../repository'
import type { Photo } from '../types'

export function usePhotos(tripId: string | undefined, viewerUid: string | undefined) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId || !viewerUid) return
    return subscribeToPhotos(tripId, viewerUid, (next) => {
      setPhotos(next)
      setLoading(false)
    })
  }, [tripId, viewerUid])

  if (!tripId || !viewerUid) {
    return { photos: [], loading: false }
  }

  return { photos, loading }
}
