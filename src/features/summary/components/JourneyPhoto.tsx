import { usePhotoUrl } from '../../photos/hooks/usePhotoUrl'
import styles from './JourneyPhoto.module.css'

/** Billedet der vises over kortet, mens afspilningen holder pause ved det. */
export function JourneyPhoto({ storagePath, hidden }: { storagePath: string; hidden?: boolean }) {
  const url = usePhotoUrl(storagePath)
  if (!url) return null
  return (
    <div className={styles.card} hidden={hidden}>
      <img src={url} alt="" className={styles.img} />
    </div>
  )
}
