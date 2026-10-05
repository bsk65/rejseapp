import { useState } from 'react'
import { useStorageUrl } from '../../../shared/hooks/useStorageUrl'
import { useT } from '../../../shared/i18n/useT'
import { formatPassengerName } from '../logic/boardingPassImages'
import type { BoardingPassImage } from '../types'
import { BoardingPassViewer } from './BoardingPassViewer'
import styles from './BoardingPassButtons.module.css'

/** En PDF-billet åbnes i telefonens egen PDF-visning (ny fane) — den kan zoome og bladre. */
function PdfLink({ pass, label }: { pass: BoardingPassImage; label: string }) {
  const url = useStorageUrl(pass.storagePath)
  return (
    <a
      className={styles.show}
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!url}
    >
      <span aria-hidden="true">📄</span>
      {label}
    </a>
  )
}

/**
 * "Vis boardingkort"/"Vis billet" for hver gemt fil på segmentet. `onRemove`
 * (kun i segmentets formular) giver mulighed for at fjerne den igen.
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
      {passes.map((pass) => {
        const name = formatPassengerName(pass.passengerName)
        const isTicket = pass.kind === 'billet'
        const label = isTicket
          ? t('segments.showTicket', { name })
          : t('segments.showPass', { name })
        return (
          <div key={pass.storagePath} className={styles.row}>
            {pass.contentType === 'application/pdf' ? (
              <PdfLink pass={pass} label={label} />
            ) : (
              <button type="button" className={styles.show} onClick={() => setShowing(pass)}>
                <span aria-hidden="true">🎫</span>
                {label}
              </button>
            )}
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
                  aria-label={
                    isTicket
                      ? t('segments.removeTicketLabel', { name })
                      : t('segments.removePassLabel', { name })
                  }
                >
                  {t('segments.remove')}
                </button>
              ))}
          </div>
        )
      })}
      {showing && <BoardingPassViewer pass={showing} onClose={() => setShowing(null)} />}
    </div>
  )
}
