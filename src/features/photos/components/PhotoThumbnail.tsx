import { useStorageUrl } from '../../../shared/hooks/useStorageUrl'
import { useT } from '../../../shared/i18n/useT'
import styles from './PhotoThumbnail.module.css'

export function PhotoThumbnail({
  storagePath,
  onDelete,
}: {
  storagePath: string
  onDelete?: () => void
}) {
  const { t } = useT()
  const url = useStorageUrl(storagePath)

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
          aria-label={t('tracking.deletePhoto')}
        >
          ×
        </button>
      )}
    </div>
  )
}
