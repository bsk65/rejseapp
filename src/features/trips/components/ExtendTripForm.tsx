import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { addDaysToIsoDate, formatDayDate } from '../../../shared/utils/date'
import type { Day } from '../../days/types'
import { useExtendTrip } from '../hooks/useExtendTrip'
import { planTripExtension } from '../logic/extendTrip'
import { MAX_TRIP_DAYS, computeEndDate } from '../logic/tripDates'
import type { Trip } from '../types'
import styles from './ExtendTripForm.module.css'

/** Tekstfelt → antal dage (tomt felt = 0). */
function parseCount(text: string): number {
  return text === '' ? 0 : Number(text)
}

/** "Tilføj dage" på Dage-fanen: forlæng rejsen før start og/eller efter slut. */
export function ExtendTripForm({
  trip,
  days,
  userUid,
}: {
  trip: Trip
  days: Day[]
  userUid: string
}) {
  const { t, locale } = useT()
  const { extend, pending, error } = useExtendTrip()
  const [open, setOpen] = useState(false)
  const [beforeText, setBeforeText] = useState('')
  const [afterText, setAfterText] = useState('')

  if (!open) {
    return (
      <button type="button" className={styles.openButton} onClick={() => setOpen(true)}>
        {t('trips.extendOpen')}
      </button>
    )
  }

  const before = parseCount(beforeText)
  const after = parseCount(afterText)
  const total = trip.days + before + after
  const tooMany = total > MAX_TRIP_DAYS
  const nothingToAdd = before === 0 && after === 0
  const newStart = addDaysToIsoDate(trip.startDate, -before)
  const newEnd = computeEndDate(trip.startDate, trip.days + after)

  function close() {
    setOpen(false)
    setBeforeText('')
    setAfterText('')
  }

  async function save() {
    const plan = planTripExtension(trip.startDate, trip.days, days, before, after)
    if (await extend(trip.id, userUid, trip.memberUids, plan)) close()
  }

  return (
    <div className={styles.form}>
      <p className={styles.intro}>{t('trips.extendIntro')}</p>
      <div className={styles.fields}>
        <TextField
          label={t('trips.extendBefore')}
          inputMode="numeric"
          placeholder="0"
          value={beforeText}
          onChange={(e) => setBeforeText(e.target.value.replace(/\D/g, ''))}
        />
        <TextField
          label={t('trips.extendAfter')}
          inputMode="numeric"
          placeholder="0"
          value={afterText}
          onChange={(e) => setAfterText(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      {!nothingToAdd && !tooMany && (
        <p className={styles.preview}>
          {t('trips.extendPreview', {
            start: formatDayDate(newStart, locale),
            end: formatDayDate(newEnd, locale),
            count: total,
          })}
        </p>
      )}
      {tooMany && (
        <p className={styles.error}>{t('trips.errorTooManyDays', { max: MAX_TRIP_DAYS })}</p>
      )}
      {error && <p className={styles.error}>{t(error)}</p>}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" disabled={pending} onClick={close}>
          {t('common.undo')}
        </Button>
        <Button
          type="button"
          disabled={pending || tooMany || nothingToAdd}
          onClick={() => void save()}
        >
          {pending ? t('trips.extending') : t('trips.extendSave')}
        </Button>
      </div>
    </div>
  )
}
