import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { formatPassengerName } from '../logic/boardingPassImages'
import type { BoardingPassImage } from '../types'
import { BoardingPassViewer } from './BoardingPassViewer'
import styles from './BoardingPassButtons.module.css'

/**
 * "Vis boardingkort" for hver gemt passager på flyet. `onRemove` (kun i
 * flyets formular) giver mulighed for at fjerne et kort igen.
 */
export function BoardingPassButtons({
  passes,
  onRemove,
}: {
  passes: BoardingPassImage[] | undefined
  onRemove?: (pass: BoardingPassImage) => Promise<void>
}) {
  const { t } = useT()
  const [showing, setShowing] = useState<BoardingPassImage | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  if (!passes || passes.length === 0) return null

  return (
    <div className={styles.list}>
      {passes.map((pass) => (
        <div key={pass.storagePath} className={styles.row}>
          <button type="button" className={styles.show} onClick={() => setShowing(pass)}>
            <span aria-hidden="true">🎫</span>
            {t('segments.showPass', { name: formatPassengerName(pass.passengerName) })}
          </button>
          {onRemove &&
            (confirming === pass.storagePath ? (
              <button
                type="button"
                className={styles.confirmRemove}
                onClick={() => void onRemove(pass).then(() => setConfirming(null))}
              >
                {t('segments.removeYes')}
              </button>
            ) : (
              <button
                type="button"
                className={styles.remove}
                onClick={() => setConfirming(pass.storagePath)}
                aria-label={t('segments.removePassLabel', {
                  name: formatPassengerName(pass.passengerName),
                })}
              >
                {t('segments.remove')}
              </button>
            ))}
        </div>
      ))}
      {showing && <BoardingPassViewer pass={showing} onClose={() => setShowing(null)} />}
    </div>
  )
}
