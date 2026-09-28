import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { PlaceField } from '../../../shared/ui/PlaceField'
import { TextField } from '../../../shared/ui/TextField'
import { useDeleteSegment } from '../hooks/useDeleteSegment'
import { useRemoveBoardingPass } from '../hooks/useRemoveBoardingPass'
import { BoardingPassButtons } from './BoardingPassButtons'
import { FlightLookupButton } from './FlightLookupButton'
import { useUpdateSegment } from '../hooks/useUpdateSegment'
import { withAirlineCode } from '../logic/airlineCodes'
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
  dayDate,
  segment,
  onClose,
}: {
  tripId: string
  dayId: string
  /** Dagens dato (YYYY-MM-DD) — bruges til flyopslag, hvis afgangsdato mangler. */
  dayDate: string
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
  const { removeSegment, pending: deleting } = useDeleteSegment()
  const { passes, remove: removePass } = useRemoveBoardingPass(tripId, dayId, segment)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function handleDelete() {
    await removeSegment(tripId, dayId, segment.id, passes)
    onClose()
  }

  const showsCarrier = segment.mode !== 'bil' && segment.mode !== 'gang'
  const showsTerminal = segment.mode === 'fly'
  const showsSeat = segment.mode === 'tog' || segment.mode === 'fly'
  // Dato til flyopslag: afgangsdatoen, hvis den er udfyldt, ellers dagens dato.
  const lookupDate = details.departureTime?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? dayDate

  function set<K extends keyof SegmentDetails>(field: K, value: SegmentDetails[K]) {
    setDetails((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    // Et fly-nummer uden selskabskode ("1762") gemmes med koden foran ("AF1762").
    const number =
      segment.mode === 'fly' ? withAirlineCode(details.number, details.carrier) : details.number
    await saveSegment(tripId, dayId, segment.id, { ...details, number })
    onClose()
  }

  return (
    <div className={styles.form}>
      <p className={styles.title}>{transportModeLabel[segment.mode]}-detaljer</p>

      <BoardingPassButtons passes={passes} onRemove={removePass} />

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
      {segment.mode === 'fly' && (
        <FlightLookupButton
          flightNumber={withAirlineCode(details.number, details.carrier)}
          date={lookupDate}
          onFound={(found) => setDetails((prev) => ({ ...prev, ...found }))}
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
          label={segment.mode === 'fly' ? 'Sæde' : 'Vogn/plads'}
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

      {confirmingDelete ? (
        <div className={styles.confirmDelete}>
          <p className={styles.confirmText}>
            Slet denne {transportModeLabel[segment.mode].toLowerCase()}-booking helt?
          </p>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
              Fortryd
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              Ja, slet
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          <Button
            type="button"
            variant="danger"
            className={styles.deleteButton}
            onClick={() => setConfirmingDelete(true)}
          >
            Slet
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuller
          </Button>
          <Button type="button" disabled={pending} onClick={() => void handleSave()}>
            Gem
          </Button>
        </div>
      )}
    </div>
  )
}
