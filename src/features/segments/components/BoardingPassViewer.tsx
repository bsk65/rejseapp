import { useEffect, useRef } from 'react'
import { useStorageUrl } from '../../../shared/hooks/useStorageUrl'
import { useT } from '../../../shared/i18n/useT'
import { useWakeLock } from '../../../shared/hooks/useWakeLock'
import { formatPassengerName } from '../logic/boardingPassImages'
import type { BoardingPassImage } from '../types'
import styles from './BoardingPassViewer.module.css'

/**
 * Boardingkortet i fuld skærm på hvid baggrund, så scanneren ved gaten kan
 * læse det. Skærmen holdes tændt imens. En web-app kan ikke selv skrue op for
 * lysstyrken — det må brugeren gøre (se teksten nederst).
 */
export function BoardingPassViewer({
  pass,
  onClose,
}: {
  pass: BoardingPassImage
  onClose: () => void
}) {
  const { t } = useT()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const url = useStorageUrl(pass.storagePath)
  useWakeLock(true)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    // Fuld skærm skjuler browserens bjælker, hvor det understøttes (ikke iPhone).
    dialog?.requestFullscreen?.().catch(() => undefined)
    return () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose} onClick={onClose}>
      <div className={styles.content}>
        <p className={styles.name}>{formatPassengerName(pass.passengerName)}</p>
        {url ? (
          <img
            src={url}
            alt={pass.kind === 'billet' ? t('segments.ticketAlt') : t('segments.passAlt')}
            className={styles.image}
          />
        ) : (
          <p className={styles.loading}>
            {pass.kind === 'billet' ? t('segments.loadingTicket') : t('segments.loadingPass')}
          </p>
        )}
        <p className={styles.hint}>{t('segments.brightnessHint')}</p>
      </div>
    </dialog>
  )
}
