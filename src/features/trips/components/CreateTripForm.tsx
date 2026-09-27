import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { PlaceSearchInput } from '../../../shared/ui/PlaceSearchInput'
import { TextField } from '../../../shared/ui/TextField'
import type { Place } from '../../../shared/types/place'
import { useCreateDays } from '../../days/hooks/useCreateDays'
import { useCreateTrip } from '../hooks/useCreateTrip'
import { computeEndDate, countTripDays, parseDayCount } from '../logic/tripDates'
import styles from './CreateTripForm.module.css'

/** Øvre grænse — dage oprettes i én Firestore-batch (maks. 500 skrivninger). */
const MAX_DAYS = 365

export function CreateTripForm({
  ownerUid,
  onCreated,
}: {
  ownerUid: string
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  // Tekst, ikke tal — ellers bliver et tomt felt til "0", og man ender med "04".
  const [daysText, setDaysText] = useState('')
  const [destinations, setDestinations] = useState<Place[]>([])
  const [formError, setFormError] = useState<string | null>(null)
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
      setFormError('Vælg en slutdato eller skriv antal dage.')
      return
    }
    if (days > MAX_DAYS) {
      setFormError(`En rejse kan højst vare ${MAX_DAYS} dage.`)
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

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField label="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <TextField
        label="Startdato"
        type="date"
        value={startDate}
        onChange={(e) => changeStartDate(e.target.value)}
        required
      />

      <div className={styles.duration}>
        <TextField
          label="Slutdato"
          type="date"
          min={startDate || undefined}
          value={endDate}
          onChange={(e) => changeEndDate(e.target.value)}
        />
        <span className={styles.or}>eller</span>
        <TextField
          label="Antal dage"
          inputMode="numeric"
          placeholder="f.eks. 4"
          value={daysText}
          onChange={(e) => changeDays(e.target.value)}
        />
      </div>
      {endBeforeStart && <p className={styles.error}>Slutdatoen ligger før startdatoen.</p>}

      <PlaceSearchInput label="Tilføj destination" onSelect={addDestination} />
      {destinations.length > 0 && (
        <ul className={styles.destinations}>
          {destinations.map((place) => (
            <li key={place.placeId} className={styles.destinationChip}>
              <span>{place.name}</span>
              <button
                type="button"
                onClick={() => removeDestination(place.placeId)}
                aria-label={`Fjern ${place.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {(formError || error) && <p className={styles.error}>{formError ?? error}</p>}
      <Button type="submit" disabled={pending || endBeforeStart}>
        Opret rejse
      </Button>
    </form>
  )
}
