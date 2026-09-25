import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useCreateTrip } from '../hooks/useCreateTrip'
import { parseDestinationNames, toPlaceholderPlace } from '../logic/destinations'
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
  const [destinationsRaw, setDestinationsRaw] = useState('')
  const { create, pending, error } = useCreateTrip(ownerUid)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const destinations = parseDestinationNames(destinationsRaw).map(toPlaceholderPlace)
    const ok = await create({ title, startDate, days, destinations })
    if (ok) {
      setTitle('')
      setStartDate('')
      setDays(1)
      setDestinationsRaw('')
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
      <TextField
        label="Destinationer (kommasepareret)"
        placeholder="Rom, Firenze, Venedig"
        value={destinationsRaw}
        onChange={(e) => setDestinationsRaw(e.target.value)}
      />
      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" disabled={pending}>
        Opret rejse
      </Button>
    </form>
  )
}
