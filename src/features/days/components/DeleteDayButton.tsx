import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { formatDayDate } from '../../../shared/utils/date'
import type { Day } from '../types'
import styles from './DeleteDayButton.module.css'

/**
 * "Slet dag" nederst i en udfoldet dag — kun rejsens første og sidste dag, og
 * kun for ejeren. Bekræftelsen siger, hvad der forsvinder med dagen.
 */
export function DeleteDayButton({
  day,
  segmentCount,
  photoCount,
  error,
  onDelete,
}: {
  day: Day
  segmentCount: number
  photoCount: number
  error: TextKey | null
  onDelete: () => Promise<boolean>
}) {
  const { t, locale } = useT()
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    const deleted = await onDelete()
    setPending(false)
    if (deleted) setConfirming(false)
  }

  if (!confirming) {
    return (
      <button type="button" className={styles.openButton} onClick={() => setConfirming(true)}>
        {t('days.deleteDay')}
      </button>
    )
  }

  return (
    <div className={styles.confirm}>
      <p className={styles.text}>
        {t('days.deleteConfirm', {
          day: t('days.dayN', { n: day.dayNumber }),
          date: formatDayDate(day.date, locale),
        })}
        {segmentCount > 0 && ` ${t('days.deleteSegments', { count: segmentCount })}`}
        {photoCount > 0 && ` ${t('days.deletePhotos', { count: photoCount })}`}
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
          {pending ? t('days.deleting') : t('days.deleteYes')}
        </Button>
      </div>
    </div>
  )
}
