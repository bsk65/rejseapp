import { useState } from 'react'
import type { Day } from '../../days/types'
import { computePhotoViewerUids } from '../logic/computePhotoViewerUids'
import { matchPhotoToDay } from '../logic/matchPhotoToDay'
import { readPhotoMetadata } from '../logic/readPhotoMetadata'
import { uploadPhoto } from '../repository'

export function useUploadPhoto() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(
    tripId: string,
    uploaderUid: string,
    tripOwnerUid: string,
    memberUids: string[],
    sharePhotos: boolean,
    days: Day[],
    file: File,
  ): Promise<void> {
    setPending(true)
    setError(null)
    try {
      const metadata = await readPhotoMetadata(file)
      const dayId = matchPhotoToDay(metadata.takenAt, days)
      const photoViewerUids = computePhotoViewerUids(
        sharePhotos,
        memberUids,
        tripOwnerUid,
        uploaderUid,
      )
      await uploadPhoto(tripId, uploaderUid, photoViewerUids, file, {
        takenAt: metadata.takenAt,
        location: metadata.location,
        dayId,
      })
    } catch {
      setError('Kunne ikke uploade billedet. Prøv igen.')
    } finally {
      setPending(false)
    }
  }

  return { upload, pending, error }
}
