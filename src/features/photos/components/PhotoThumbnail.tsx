import { usePhotoUrl } from '../hooks/usePhotoUrl'
import styles from './PhotoThumbnail.module.css'

export function PhotoThumbnail({
  storagePath,
  onDelete,
}: {
  storagePath: string
  onDelete?: () => void
}) {
  const url = usePhotoUrl(storagePath)

  return (
    <div className={styles.thumb}>
      {url ? (
        <img src={url} alt="" className={styles.img} />
      ) : (
        <div className={styles.placeholder} />
      )}
      {onDelete && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={onDelete}
          aria-label="Slet billede"
        >
          ×
        </button>
      )}
    </div>
  )
}
