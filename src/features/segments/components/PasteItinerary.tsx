import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useCreateSegment } from '../hooks/useCreateSegment'
import { parseFlightItinerary, type ParsedFlightDraft } from '../logic/parseItinerary'
import styles from './PasteItinerary.module.css'

export function PasteItinerary({
  tripId,
  dayId,
  ownerUid,
  onDone,
}: {
  tripId: string
  dayId: string
  ownerUid: string
  onDone: () => void
}) {
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<ParsedFlightDraft | null>(null)
  const { addSegment, pending } = useCreateSegment()

  function handleTextChange(value: string) {
    setText(value)
    setDraft(value.trim() ? parseFlightItinerary(value) : null)
  }

  function updateDraft(field: keyof ParsedFlightDraft, value: string) {
    setDraft((prev) => (prev ? { ...prev, [field]: value || undefined } : prev))
  }

  async function handleApprove() {
    if (!draft) return
    const routeNote =
      draft.departureAirport && draft.arrivalAirport
        ? `Rute: ${draft.departureAirport} → ${draft.arrivalAirport}`
        : undefined

    await addSegment(tripId, dayId, ownerUid, 'fly', {
      carrier: draft.carrier,
      number: draft.number,
      departureTime: draft.departureTime,
      arrivalTime: draft.arrivalTime,
      bookingRef: draft.bookingRef,
      freeText: routeNote,
    })
    setText('')
    setDraft(null)
    onDone()
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor="paste-itinerary">
        Indsæt rejseplan (fra bekræftelses-mail)
      </label>
      <textarea
        id="paste-itinerary"
        className={styles.textarea}
        rows={5}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Sæt teksten fra din flybekræftelse ind her…"
      />

      {draft && (
        <div className={styles.preview}>
          <p className={styles.previewTitle}>Foreslået segment — ret hvis nødvendigt:</p>
          <TextField
            label="Selskab"
            value={draft.carrier ?? ''}
            onChange={(e) => updateDraft('carrier', e.target.value)}
          />
          <TextField
            label="Flynummer"
            value={draft.number ?? ''}
            onChange={(e) => updateDraft('number', e.target.value)}
          />
          <TextField
            label="Fra lufthavn (kode)"
            value={draft.departureAirport ?? ''}
            onChange={(e) => updateDraft('departureAirport', e.target.value.toUpperCase())}
          />
          <TextField
            label="Til lufthavn (kode)"
            value={draft.arrivalAirport ?? ''}
            onChange={(e) => updateDraft('arrivalAirport', e.target.value.toUpperCase())}
          />
          <TextField
            label="Afgang"
            value={draft.departureTime ?? ''}
            onChange={(e) => updateDraft('departureTime', e.target.value)}
          />
          <TextField
            label="Ankomst"
            value={draft.arrivalTime ?? ''}
            onChange={(e) => updateDraft('arrivalTime', e.target.value)}
          />
          <TextField
            label="Booking-ref"
            value={draft.bookingRef ?? ''}
            onChange={(e) => updateDraft('bookingRef', e.target.value)}
          />
          <Button type="button" disabled={pending} onClick={() => void handleApprove()}>
            Godkend og tilføj
          </Button>
        </div>
      )}
    </div>
  )
}
