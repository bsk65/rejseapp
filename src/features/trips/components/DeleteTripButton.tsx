import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { useDeleteTrip } from '../hooks/useDeleteTrip'
import styles from './DeleteTripButton.module.css'

/** "Slet rejse" nederst på rejsesiden — kun for ejeren, med bekræftelse. */
export function DeleteTripButton({
  tripId,
  ownerUid,
  title,
  shared,
}: {
  tripId: string
  ownerUid: string
  title: string
  shared: boolean
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const { deleteTrip, pending, error } = useDeleteTrip()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    if (await deleteTrip(tripId, ownerUid)) {
      navigate('/', { replace: true })
    }
  }

  if (!confirming) {
    return (
      <button type="button" className={styles.openButton} onClick={() => setConfirming(true)}>
        {t('trips.deleteTrip')}
      </button>
    )
  }

  return (
    <div className={styles.confirm}>
      <p className={styles.text}>
        {t('trips.deleteConfirm', { title })}
        {shared && ` ${t('trips.deleteShared')}`}
      </p>
      {error && <p className={styles.error}>{t(error)}</p>}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          {t('common.undo')}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => void handleDelete()}
        >
          {pending ? t('trips.deleting') : t('trips.deleteYes')}
        </Button>
      </div>
    </div>
  )
}
