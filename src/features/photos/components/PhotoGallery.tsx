import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { useDeletePhoto } from '../hooks/useDeletePhoto'
import type { Photo } from '../types'
import { PhotoThumbnail } from './PhotoThumbnail'
import styles from './PhotoGallery.module.css'

export function PhotoGallery({ tripId, photos }: { tripId: string; photos: Photo[] }) {
  const { user } = useAuthUser()
  const { remove } = useDeletePhoto()

  if (photos.length === 0) {
    return null
  }

  return (
    <ul className={styles.list}>
      {photos.map((photo) => (
        <li key={photo.id}>
          <PhotoThumbnail
            storagePath={photo.storagePath}
            onDelete={
              user?.uid === photo.ownerUid
                ? () => void remove(tripId, photo.id, photo.storagePath)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  )
}
