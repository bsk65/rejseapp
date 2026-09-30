import { useState, type FormEvent } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { PlaceSearchInput } from '../../../shared/ui/PlaceSearchInput'
import { TextField } from '../../../shared/ui/TextField'
import type { Place } from '../../../shared/types/place'
import { useCreateDays } from '../../days/hooks/useCreateDays'
import { useCreateTrip } from '../hooks/useCreateTrip'
import {
  MAX_TRIP_DAYS as MAX_DAYS,
  computeEndDate,
  countTripDays,
  parseDayCount,
} from '../logic/tripDates'
import { placeLabel } from '../../../shared/utils/placeLabel'
import styles from './CreateTripForm.module.css'

export function CreateTripForm({
  ownerUid,
  onCreated,
}: {
  ownerUid: string
  onCreated: () => void
}) {
  const { t } = useT()
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  // Tekst, ikke tal — ellers bliver et tomt felt til "0", og man ender med "04".
  const [daysText, setDaysText] = useState('')
  const [destinations, setDestinations] = useState<Place[]>([])
  const [formError, setFormError] = useState<TextKey | null>(null)
  const { create, pending, error } = useCreateTrip(ownerUid)
  const { createDays } = useCreateDays()

  // Slutdato og antal dage holdes i sync: det felt man ændrer, styrer det andet.
  function changeStartDate(value: string) {
    setStartDate(value)
    const days = parseDayCount(daysText)
    if (value && days) {
      setEndDate(computeEndDate(value, days))
    } else if (value && endDate) {
      const counted = countTripDays(value, endDate)
      setDaysText(counted ? String(counted) : '')
    }
  }

  function changeEndDate(value: string) {
    setEndDate(value)
    const counted = countTripDays(startDate, value)
    if (counted) setDaysText(String(counted))
  }

  function changeDays(value: string) {
    const digits = value.replace(/\D/g, '')
    setDaysText(digits)
    const days = parseDayCount(digits)
    if (startDate && days && days <= MAX_DAYS) setEndDate(computeEndDate(startDate, days))
  }

  function addDestination(place: Place) {
    setDestinations((prev) =>
      prev.some((d) => d.placeId === place.placeId) ? prev : [...prev, place],
    )
  }

  function removeDestination(placeId: string) {
    setDestinations((prev) => prev.filter((d) => d.placeId !== placeId))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const days = parseDayCount(daysText)
    if (!days) {
      setFormError('trips.errorNoDays')
      return
    }
    if (days > MAX_DAYS) {
      setFormError('trips.errorTooManyDays')
      return
    }
    setFormError(null)

    const tripId = await create({ title, startDate, days, destinations })
    if (tripId) {
      await createDays(tripId, ownerUid, [ownerUid], days, startDate)
      setTitle('')
      setStartDate('')
      setEndDate('')
      setDaysText('')
      setDestinations([])
      onCreated()
    }
  }

  const endBeforeStart = Boolean(startDate && endDate && endDate < startDate)
  const shownError = formError ?? error

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField
        label={t('trips.title')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <TextField
        label={t('trips.startDate')}
        type="date"
        value={startDate}
        onChange={(e) => changeStartDate(e.target.value)}
        required
      />

      <div className={styles.duration}>
        <TextField
          label={t('trips.endDate')}
          type="date"
          min={startDate || undefined}
          value={endDate}
          onChange={(e) => changeEndDate(e.target.value)}
        />
        <span className={styles.or}>{t('trips.or')}</span>
        <TextField
          label={t('trips.dayCount')}
          inputMode="numeric"
          placeholder={t('trips.dayCountPlaceholder')}
          value={daysText}
          onChange={(e) => changeDays(e.target.value)}
        />
      </div>
      {endBeforeStart && <p className={styles.error}>{t('trips.endBeforeStart')}</p>}

      <PlaceSearchInput label={t('trips.addDestination')} onSelect={addDestination} />
      {destinations.length > 0 && (
        <ul className={styles.destinations}>
          {destinations.map((place) => (
            <li key={place.placeId} className={styles.destinationChip}>
              <span>{placeLabel(place)}</span>
              <button
                type="button"
                onClick={() => removeDestination(place.placeId)}
                aria-label={t('trips.removeDestination', { name: place.name })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {shownError && <p className={styles.error}>{t(shownError, { max: MAX_DAYS })}</p>}
      <Button type="submit" disabled={pending || endBeforeStart}>
        {t('trips.createTrip')}
      </Button>
    </form>
  )
}
