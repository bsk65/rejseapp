import { useState } from 'react'
import { removeBoardingPass, saveBoardingPasses, uploadBoardingPassImage } from '../repository'
import type { BoardingPassImage, Segment } from '../types'

/**
 * Segmentets gemte boardingkort/billetter, som formularen viser — upload af en
 * billet og fjernelse. Listen holdes lokalt, fordi formularens segment er et
 * øjebliksbillede fra da den blev åbnet (ellers ville to ændringer i træk
 * genskabe den første).
 */
export function useBoardingPasses(tripId: string, dayId: string, segment: Segment) {
  const [passes, setPasses] = useState<BoardingPassImage[]>(segment.boardingPasses ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)

  async function remove(pass: BoardingPassImage): Promise<void> {
    const remaining = passes.filter((p) => p.storagePath !== pass.storagePath)
    await removeBoardingPass(tripId, dayId, segment.id, remaining, pass.storagePath)
    setPasses(remaining)
  }

  /** Billet (billede eller PDF). Lægges til listen — man kan have flere (billet + pladsbillet). */
  async function addTicket(file: File, passengerName: string, ownerUid: string): Promise<void> {
    setUploading(true)
    setUploadFailed(false)
    try {
      const storagePath = await uploadBoardingPassImage(tripId, ownerUid, file, 'billet')
      const next: BoardingPassImage[] = [
        ...passes,
        {
          storagePath,
          passengerName,
          ownerUid,
          kind: 'billet',
          contentType: file.type || 'image/jpeg',
        },
      ]
      await saveBoardingPasses(tripId, dayId, segment.id, next)
      setPasses(next)
    } catch {
      setUploadFailed(true)
    } finally {
      setUploading(false)
    }
  }

  return { passes, remove, addTicket, uploading, uploadFailed }
}
