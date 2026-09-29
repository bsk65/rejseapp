import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
        Slet rejse
      </button>
    )
  }

  return (
    <div className={styles.confirm}>
      <p className={styles.text}>
        Slet “{title}” helt? Alle dage, transport, overnatninger, billeder og spor slettes, og det
        kan ikke fortrydes.
        {shared && ' Rejsen forsvinder også for dem, den er delt med.'}
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Fortryd
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => void handleDelete()}
        >
          {pending ? 'Sletter…' : 'Ja, slet rejsen'}
        </Button>
      </div>
    </div>
  )
}
