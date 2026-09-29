import { useState } from 'react'
import { searchPlaces } from '../../../shared/api/nominatim'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import type { Place } from '../../../shared/types/place'
import { parseStayConfirmation, type ParsedStay } from '../logic/parseStayConfirmation'
import type { StayDetails } from '../types'
import styles from './StayConfirmationPaste.module.css'

const FIELD_NAMES: Partial<Record<keyof ParsedStay, TextKey>> = {
  name: 'stays.fieldName',
  address: 'stays.fieldAddress',
  checkInDate: 'stays.fieldCheckIn',
  checkOutDate: 'stays.fieldCheckOut',
  bookingRef: 'stays.fieldBookingRef',
  hostPhone: 'stays.fieldPhone',
  accessCode: 'stays.fieldAccessCode',
  wifi: 'stays.fieldWifi',
}

/** Resultatet af sidste udfyldning — oversættes først, når det vises. */
type FillResult = { found: TextKey[]; missingAddress?: string } | 'nothing'

/**
 * "Indsæt bekræftelse": teksten fra en Booking-, Airbnb- eller hotelmail
 * udfylder formularens felter. Adressen slås op som sted (første resultat).
 */
export function StayConfirmationPaste({
  referenceDate,
  onFill,
}: {
  /** Bruges til at gætte året, hvis bekræftelsen ikke skriver det. */
  referenceDate: string
  onFill: (details: Partial<StayDetails>) => void
}) {
  const { t } = useT()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FillResult | null>(null)

  async function handleFill() {
    const parsedResult = parseStayConfirmation(text, referenceDate)
    const { address, ...parsed } = parsedResult
    const found = (Object.keys(parsedResult) as (keyof ParsedStay)[])
      .map((key) => FIELD_NAMES[key])
      .filter((key): key is TextKey => Boolean(key))

    if (found.length === 0) {
      setResult('nothing')
      return
    }

    setBusy(true)
    let place: Place | undefined
    if (address) place = (await searchPlaces(address).catch(() => []))[0]
    setBusy(false)

    onFill({ ...parsed, ...(place ? { place } : {}) })
    setText('')
    setResult({ found, missingAddress: address && !place ? address : undefined })
  }

  function describeResult(shown: FillResult): string {
    if (shown === 'nothing') return t('stays.nothingFound')
    const filled = t('stays.filled', { fields: shown.found.map((key) => t(key)).join(', ') })
    return shown.missingAddress
      ? `${filled} ${t('stays.addressNotFound', { address: shown.missingAddress })}`
      : filled
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor="stay-confirmation">
        {t('stays.pasteLabel')}
      </label>
      <textarea
        id="stay-confirmation"
        className={styles.textarea}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('stays.pastePlaceholder')}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={!text.trim() || busy}
        onClick={() => void handleFill()}
      >
        {busy ? t('stays.lookingUpAddress') : t('stays.fillFields')}
      </Button>
      {result && <p className={styles.message}>{describeResult(result)}</p>}
    </div>
  )
}
