import { useRef, type ChangeEvent } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import type { Day } from '../../days/types'
import { useBoardingPassImport } from '../hooks/useBoardingPassImport'
import type { TicketEntry } from '../logic/tickets'
import styles from './BoardingPassScan.module.css'

/** "Scan boardingkort": foto af papirkort eller skærmbillede af mobil-boardingkort. */
export function BoardingPassScan(props: {
  tripId: string
  days: Day[]
  entries: TicketEntry[]
  userUid: string
  memberUids: string[]
}) {
  const { t } = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const { importImage, pending, messages, error } = useBoardingPassImport(props)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) await importImage(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => void handleChange(e)}
        disabled={pending}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? t('segments.readingPass') : t('segments.scanPass')}
      </Button>
      <p className={styles.hint}>{t('segments.scanHint')}</p>
      {error && <p className={styles.error}>{t(error.key, error.params)}</p>}
      {messages.map((message, index) => (
        <p key={index} className={styles.message}>
          {t(message.key, message.params)}
        </p>
      ))}
    </div>
  )
}
