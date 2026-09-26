import { getDownloadURL, ref } from 'firebase/storage'
import { useEffect, useState } from 'react'
import { storage } from '../../../firebase/config'
import styles from './PhotoThumbnail.module.css'

export function PhotoThumbnail({
  storagePath,
  onDelete,
}: {
  storagePath: string
  onDelete?: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getDownloadURL(ref(storage, storagePath))
      .then((downloadUrl) => {
        if (!cancelled) setUrl(downloadUrl)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [storagePath])

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
