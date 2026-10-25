import { useRef, type ChangeEvent } from 'react'
import type { Message } from '../../../shared/i18n/message'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import styles from './TicketUpload.module.css'

const variants: Record<
  'billet' | 'boardingkort' | 'reservation',
  { accept: string; label: TextKey; pending: TextKey; hint: TextKey }
> = {
  billet: {
    accept: 'image/*,application/pdf',
    label: 'segments.addTicket',
    pending: 'segments.uploadingTicket',
    hint: 'segments.addTicketHint',
  },
  boardingkort: {
    accept: 'image/*',
    label: 'segments.scanPass',
    pending: 'segments.readingPass',
    hint: 'segments.scanPassFormHint',
  },
  reservation: {
    accept: 'image/*,application/pdf',
    label: 'reservations.addTicket',
    pending: 'segments.uploadingTicket',
    hint: 'reservations.addTicketHint',
  },
}

/**
 * "Tilføj billet": PDF, foto eller skærmbillede af billetten (tog, bus, færge).
 * "Scan boardingkort" (fly): foto eller skærmbillede af boardingkortets stregkode.
 * "Tilføj billet eller bekræftelse" (reservationer): som billetten.
 */
export function TicketUpload({
  kind,
  uploading,
  error,
  onFile,
}: {
  kind: 'billet' | 'boardingkort' | 'reservation'
  uploading: boolean
  error: Message | null
  onFile: (file: File) => Promise<void>
}) {
  const { t } = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const variant = variants[kind]

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
        accept={variant.accept}
        className={styles.hiddenInput}
        onChange={(e) => void handleChange(e)}
        disabled={uploading}
      />
      <Button
        type="button"
        variant="secondary"
        className={styles.button}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? t(variant.pending) : t(variant.label)}
      </Button>
      <p className={styles.hint}>{t(variant.hint)}</p>
      {error && <p className={styles.error}>{t(error.key, error.params)}</p>}
    </div>
  )
}
