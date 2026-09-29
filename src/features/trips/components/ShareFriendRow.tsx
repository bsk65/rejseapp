import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import styles from './ShareTripDialog.module.css'

/**
 * Én person i "Del rejse": hak for deling og — for venner på vennelisten —
 * "Fjern" (fra vennelisten) med bekræftelse.
 */
export function ShareFriendRow({
  label,
  checked,
  onToggle,
  onRemove,
}: {
  label: string
  checked: boolean
  onToggle: () => void
  /** Mangler for rejsefæller, der ikke (længere) står på vennelisten. */
  onRemove?: () => Promise<void>
}) {
  const { t } = useT()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function handleRemove() {
    if (!onRemove) return
    setPending(true)
    setFailed(false)
    try {
      await onRemove()
    } catch {
      setFailed(true)
      setPending(false)
    }
  }

  return (
    <li className={styles.friendItem}>
      <div className={styles.friendLine}>
        <label className={styles.friendRow}>
          <input type="checkbox" checked={checked} onChange={onToggle} />
          <span className={styles.friendName}>{label}</span>
        </label>
        {onRemove && !confirming && (
          <button
            type="button"
            className={styles.removeFriend}
            onClick={() => setConfirming(true)}
            aria-label={t('trips.removeFriendLabel', { name: label })}
          >
            {t('trips.removeFriend')}
          </button>
        )}
      </div>
      {confirming && (
        <div className={styles.confirmRemove}>
          <p className={styles.confirmText}>{t('trips.removeFriendConfirm', { name: label })}</p>
          {failed && <p className={styles.error}>{t('trips.errorRemoveFriend')}</p>}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.linkButton}
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              {t('common.undo')}
            </button>
            <button
              type="button"
              className={styles.dangerLink}
              disabled={pending}
              onClick={() => void handleRemove()}
            >
              {t('trips.removeFriendYes')}
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
