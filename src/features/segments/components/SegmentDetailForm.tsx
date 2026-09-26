import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { PlaceField } from '../../../shared/ui/PlaceField'
import { TextField } from '../../../shared/ui/TextField'
import { useUpdateSegment } from '../hooks/useUpdateSegment'
import { transportModeLabel, type Segment, type SegmentDetails, type SegmentStatus } from '../types'
import styles from './SegmentDetailForm.module.css'

const carrierLabel: Partial<Record<Segment['mode'], string>> = {
  fly: 'Selskab',
  tog: 'Operatør',
}

const numberLabel: Partial<Record<Segment['mode'], string>> = {
  fly: 'Flynummer',
  tog: 'Tognummer',
}

export function SegmentDetailForm({
  tripId,
  dayId,
  segment,
  onClose,
}: {
  tripId: string
  dayId: string
  segment: Segment
  onClose: () => void
}) {
  const [details, setDetails] = useState<SegmentDetails>({
    status: segment.status,
    carrier: segment.carrier,
    number: segment.number,
    departurePlace: segment.departurePlace,
    departureTime: segment.departureTime,
    terminal: segment.terminal,
    arrivalPlace: segment.arrivalPlace,
    arrivalTime: segment.arrivalTime,
    seat: segment.seat,
    bookingRef: segment.bookingRef,
    freeText: segment.freeText,
  })
  const { saveSegment, pending } = useUpdateSegment()

  const showsCarrier = segment.mode !== 'bil' && segment.mode !== 'gang'
  const showsTerminal = segment.mode === 'fly'
  const showsSeat = segment.mode === 'tog'

  function set<K extends keyof SegmentDetails>(field: K, value: SegmentDetails[K]) {
    setDetails((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    await saveSegment(tripId, dayId, segment.id, details)
    onClose()
  }

  return (
    <div className={styles.form}>
      <p className={styles.title}>{transportModeLabel[segment.mode]}-detaljer</p>

      {showsCarrier && (
        <TextField
          label={carrierLabel[segment.mode] ?? 'Selskab'}
          value={details.carrier ?? ''}
          onChange={(e) => set('carrier', e.target.value || undefined)}
        />
      )}
      {showsCarrier && (
        <TextField
          label={numberLabel[segment.mode] ?? 'Nummer'}
          value={details.number ?? ''}
          onChange={(e) => set('number', e.target.value || undefined)}
        />
      )}

      <PlaceField
        label="Fra"
        place={details.departurePlace}
        onSelect={(place) => set('departurePlace', place)}
      />
      <TextField
        label="Afgangstidspunkt"
        type="datetime-local"
        value={details.departureTime ?? ''}
        onChange={(e) => set('departureTime', e.target.value || undefined)}
      />
      {showsTerminal && (
        <TextField
          label="Terminal"
          value={details.terminal ?? ''}
          onChange={(e) => set('terminal', e.target.value || undefined)}
        />
      )}

      <PlaceField
        label="Til"
        place={details.arrivalPlace}
        onSelect={(place) => set('arrivalPlace', place)}
      />
      <TextField
        label="Ankomsttidspunkt"
        type="datetime-local"
        value={details.arrivalTime ?? ''}
        onChange={(e) => set('arrivalTime', e.target.value || undefined)}
      />
      {showsSeat && (
        <TextField
          label="Vogn/plads"
          value={details.seat ?? ''}
          onChange={(e) => set('seat', e.target.value || undefined)}
        />
      )}

      {showsCarrier && (
        <TextField
          label="Booking-ref"
          value={details.bookingRef ?? ''}
          onChange={(e) => set('bookingRef', e.target.value || undefined)}
        />
      )}

      <TextField
        label="Note"
        value={details.freeText ?? ''}
        onChange={(e) => set('freeText', e.target.value || undefined)}
      />

      <label className={styles.statusRow}>
        <input
          type="checkbox"
          checked={details.status === 'bekræftet'}
          onChange={(e) =>
            set('status', (e.target.checked ? 'bekræftet' : 'planlagt') satisfies SegmentStatus)
          }
        />
        Bekræftet booking
      </label>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Annuller
        </Button>
        <Button type="button" disabled={pending} onClick={() => void handleSave()}>
          Gem
        </Button>
      </div>
    </div>
  )
}
