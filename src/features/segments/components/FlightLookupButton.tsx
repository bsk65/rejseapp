import { useT } from '../../../shared/i18n/useT'
import { formatDayDate } from '../../../shared/utils/date'
import { Button } from '../../../shared/ui/Button'
import { useFlightLookup } from '../hooks/useFlightLookup'
import type { SegmentDetails } from '../types'
import styles from './FlightLookupButton.module.css'

/**
 * "Hent flyoplysninger": slår flynummer + dato op og udfylder lufthavne,
 * tider og terminal i formularen (gemmes først, når man trykker Gem).
 */
export function FlightLookupButton({
  flightNumber,
  date,
  onFound,
}: {
  flightNumber: string | undefined
  /** YYYY-MM-DD */
  date: string
  onFound: (details: Partial<SegmentDetails>) => void
}) {
  const { t, locale } = useT()
  const { lookup, pending, error } = useFlightLookup()
  const canLookup = Boolean(flightNumber && flightNumber.trim().length >= 3)

  async function handleClick() {
    if (!flightNumber) return
    const details = await lookup(flightNumber, date)
    if (details) onFound(details)
  }

  return (
    <div className={styles.wrapper}>
      <Button
        type="button"
        variant="secondary"
        disabled={!canLookup || pending}
        onClick={() => void handleClick()}
      >
        {pending ? t('segments.lookingUp') : t('segments.lookupButton')}
      </Button>
      <p className={styles.hint}>
        {canLookup
          ? t('segments.lookupHint', {
              flight: flightNumber ?? '',
              date: formatDayDate(date, locale),
            })
          : t('segments.lookupNeedNumber')}
      </p>
      {error && <p className={styles.error}>{t(error.key, error.params)}</p>}
    </div>
  )
}
