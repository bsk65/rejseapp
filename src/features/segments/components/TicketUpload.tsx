import { useRef, type ChangeEvent } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import styles from './TicketUpload.module.css'

/** "Tilføj billet": PDF, foto eller skærmbillede af billetten (tog, bus, færge). */
export function TicketUpload({
  uploading,
  failed,
  onFile,
}: {
  uploading: boolean
  failed: boolean
  onFile: (file: File) => Promise<void>
}) {
  const { t } = useT()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) await onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className={styles.hiddenInput}
        onChange={(e) => void handleChange(e)}
        disabled={uploading}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? t('segments.uploadingTicket') : t('segments.addTicket')}
      </Button>
      <p className={styles.hint}>{t('segments.addTicketHint')}</p>
      {failed && <p className={styles.error}>{t('segments.ticketNotSaved')}</p>}
    </div>
  )
}
