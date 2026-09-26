import type { Timestamp } from 'firebase/firestore'
import type { LatLng } from '../../shared/types/place'

export type Photo = {
  id: string
  storagePath: string
  takenAt?: string
  location?: LatLng
  dayId?: string
  /** Hvem der uploadede billedet. */
  ownerUid: string
  /** Hvem der må se billedet lige nu — styres af trippens sharedCategories.photos. Se CLAUDE.md. */
  photoViewerUids: string[]
  uploadedAt: Timestamp | null
}
