import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { useDays } from '../../days/hooks/useDays'
import { usePeople } from '../../friends/hooks/usePeople'
import { Button } from '../../../shared/ui/Button'
import { PlaceField } from '../../../shared/ui/PlaceField'
import { TextField } from '../../../shared/ui/TextField'
import { useDeleteSegment } from '../hooks/useDeleteSegment'
import { useBoardingPasses } from '../hooks/useBoardingPasses'
import { BoardingPassButtons } from './BoardingPassButtons'
import { FlightLookupButton } from './FlightLookupButton'
import { TicketUpload } from './TicketUpload'
import { TravelersPicker } from './TravelersPicker'
import { dayIdForDeparture } from '../logic/segmentDay'
import { travelersOf } from '../logic/travelers'
import { useUpdateSegment } from '../hooks/useUpdateSegment'
import { withAirlineCode } from '../logic/airlineCodes'
import { transportModeLabel, type Segment, type SegmentDetails, type SegmentStatus } from '../types'
import styles from './SegmentDetailForm.module.css'

const carrierLabel: Partial<Record<Segment['mode'], TextKey>> = {
  fly: 'segments.carrierAirline',
  tog: 'segments.carrierOperator',
}

const numberLabel: Partial<Record<Segment['mode'], TextKey>> = {
  fly: 'segments.numberFlight',
  tog: 'segments.numberTrain',
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
  const { t } = useT()
  const modeName = t(transportModeLabel[segment.mode])
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
    travelerUids: travelersOf(segment),
  })
  const { saveSegment, saveAndMoveSegment, pending } = useUpdateSegment()
  const { removeSegment, pending: deleting } = useDeleteSegment()
  const { selfUid, nameOf } = usePeople()
  const { days } = useDays(tripId, selfUid)
  const {
    passes,
    remove: removePass,
    addTicket,
    uploading,
    uploadFailed,
  } = useBoardingPasses(tripId, dayId, segment)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function handleDelete() {
    await removeSegment(tripId, dayId, segment.id, passes)
    onClose()
  }

  const showsCarrier = segment.mode !== 'bil' && segment.mode !== 'gang'
  const showsTerminal = segment.mode === 'fly'
  const showsSeat = segment.mode === 'tog' || segment.mode === 'fly'
  // Fly får boardingkort via "Scan boardingkort"; andre billetter uploades her.
  const showsTicketUpload =
    segment.mode === 'tog' || segment.mode === 'bus' || segment.mode === 'færge'
  // Dato til flyopslag: afgangsdatoen, hvis den er udfyldt, ellers dagens dato.
  const lookupDate = details.departureTime?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? dayDate

  function set<K extends keyof SegmentDetails>(field: K, value: SegmentDetails[K]) {
    setDetails((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    // Et fly-nummer uden selskabskode ("1762") gemmes med koden foran ("AF1762").
    const number =
      segment.mode === 'fly' ? withAirlineCode(details.number, details.carrier) : details.number
    const patch = { ...details, number }
    // Er afgangsdatoen ændret til en anden af rejsens dage, flyttes segmentet dertil.
    const targetDayId = dayIdForDeparture(details.departureTime, days, dayId)
    if (targetDayId === dayId) await saveSegment(tripId, dayId, segment.id, patch)
    else await saveAndMoveSegment(tripId, dayId, targetDayId, segment, patch)
    onClose()
  }

  return (
    <div className={styles.form}>
      <p className={styles.title}>{t('segments.detailsTitle', { mode: modeName })}</p>

      <BoardingPassButtons passes={passes} onRemove={removePass} />
      {showsTicketUpload && (
        <TicketUpload
          uploading={uploading}
          failed={uploadFailed}
          onFile={(file) => addTicket(file, nameOf(selfUid), selfUid)}
        />
      )}

      <TravelersPicker
        travelers={details.travelerUids ?? travelersOf(segment)}
        onChange={(travelers) => set('travelerUids', travelers)}
      />

      {showsCarrier && (
        <TextField
          label={t(carrierLabel[segment.mode] ?? 'segments.carrierCompany')}
          value={details.carrier ?? ''}
          onChange={(e) => set('carrier', e.target.value || undefined)}
        />
      )}
      {showsCarrier && (
        <TextField
          label={t(numberLabel[segment.mode] ?? 'segments.number')}
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
        label={t('days.from')}
        place={details.departurePlace}
        onSelect={(place) => set('departurePlace', place)}
      />
      <TextField
        label={t('segments.departureTime')}
        type="datetime-local"
        value={details.departureTime ?? ''}
        onChange={(e) => set('departureTime', e.target.value || undefined)}
      />
      {showsTerminal && (
        <TextField
          label={t('segments.terminal')}
          value={details.terminal ?? ''}
          onChange={(e) => set('terminal', e.target.value || undefined)}
        />
      )}

      <PlaceField
        label={t('days.to')}
        place={details.arrivalPlace}
        onSelect={(place) => set('arrivalPlace', place)}
      />
      <TextField
        label={t('segments.arrivalTime')}
        type="datetime-local"
        value={details.arrivalTime ?? ''}
        onChange={(e) => set('arrivalTime', e.target.value || undefined)}
      />
      {showsSeat && (
        <TextField
          label={segment.mode === 'fly' ? t('segments.seatFly') : t('segments.seatTrain')}
          value={details.seat ?? ''}
          onChange={(e) => set('seat', e.target.value || undefined)}
        />
      )}

      {showsCarrier && (
        <TextField
          label={t('segments.bookingRef')}
          value={details.bookingRef ?? ''}
          onChange={(e) => set('bookingRef', e.target.value || undefined)}
        />
      )}

      <TextField
        label={t('segments.note')}
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
        {t('segments.confirmedBooking')}
      </label>

      {confirmingDelete ? (
        <div className={styles.confirmDelete}>
          <p className={styles.confirmText}>
            {t('segments.deleteConfirm', { mode: modeName.toLowerCase() })}
          </p>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
              {t('common.undo')}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {t('segments.deleteYes')}
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
            {t('common.delete')}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" disabled={pending} onClick={() => void handleSave()}>
            {t('common.save')}
          </Button>
        </div>
      )}
    </div>
  )
}
