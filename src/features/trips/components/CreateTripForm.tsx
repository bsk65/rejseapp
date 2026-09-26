import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { PlaceSearchInput } from '../../../shared/ui/PlaceSearchInput'
import { TextField } from '../../../shared/ui/TextField'
import type { Place } from '../../../shared/types/place'
import { useCreateDays } from '../../days/hooks/useCreateDays'
import { useCreateTrip } from '../hooks/useCreateTrip'
import styles from './CreateTripForm.module.css'

export function CreateTripForm({
  ownerUid,
  onCreated,
}: {
  ownerUid: string
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [days, setDays] = useState(1)
  const [destinations, setDestinations] = useState<Place[]>([])
  const { create, pending, error } = useCreateTrip(ownerUid)
  const { createDays } = useCreateDays()

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
    const tripId = await create({ title, startDate, days, destinations })
    if (tripId) {
      await createDays(tripId, ownerUid, days, startDate)
      setTitle('')
      setStartDate('')
      setDays(1)
      setDestinations([])
      onCreated()
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <TextField label="Titel" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <TextField
        label="Startdato"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />
      <TextField
        label="Antal dage"
        type="number"
        min={1}
        value={days}
        onChange={(e) => setDays(Number(e.target.value))}
        required
      />

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

      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" disabled={pending}>
        Opret rejse
      </Button>
    </form>
  )
}
