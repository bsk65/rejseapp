import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { TextField } from '../../../shared/ui/TextField'
import { useCreateSegment } from '../hooks/useCreateSegment'
import { parseFlightItinerary, type ParsedFlightDraft } from '../logic/parseItinerary'
import styles from './PasteItinerary.module.css'

export function PasteItinerary({
  tripId,
  dayId,
  creatorUid,
  memberUids,
  onDone,
}: {
  tripId: string
  dayId: string
  creatorUid: string
  memberUids: string[]
  onDone: () => void
}) {
  const { t } = useT()
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
        ? t('segments.routeNote', { from: draft.departureAirport, to: draft.arrivalAirport })
        : undefined

    await addSegment(tripId, dayId, creatorUid, memberUids, 'fly', {
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
        {t('segments.pasteLabel')}
      </label>
      <textarea
        id="paste-itinerary"
        className={styles.textarea}
        rows={5}
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={t('segments.pastePlaceholder')}
      />

      {draft && (
        <div className={styles.preview}>
          <p className={styles.previewTitle}>{t('segments.pasteSuggested')}</p>
          <TextField
            label={t('segments.carrierAirline')}
            value={draft.carrier ?? ''}
            onChange={(e) => updateDraft('carrier', e.target.value)}
          />
          <TextField
            label={t('segments.numberFlight')}
            value={draft.number ?? ''}
            onChange={(e) => updateDraft('number', e.target.value)}
          />
          <TextField
            label={t('segments.fromAirport')}
            value={draft.departureAirport ?? ''}
            onChange={(e) => updateDraft('departureAirport', e.target.value.toUpperCase())}
          />
          <TextField
            label={t('segments.toAirport')}
            value={draft.arrivalAirport ?? ''}
            onChange={(e) => updateDraft('arrivalAirport', e.target.value.toUpperCase())}
          />
          <TextField
            label={t('segments.departure')}
            value={draft.departureTime ?? ''}
            onChange={(e) => updateDraft('departureTime', e.target.value)}
          />
          <TextField
            label={t('segments.arrival')}
            value={draft.arrivalTime ?? ''}
            onChange={(e) => updateDraft('arrivalTime', e.target.value)}
          />
          <TextField
            label={t('segments.bookingRef')}
            value={draft.bookingRef ?? ''}
            onChange={(e) => updateDraft('bookingRef', e.target.value)}
          />
          <Button type="button" disabled={pending} onClick={() => void handleApprove()}>
            {t('segments.approveAdd')}
          </Button>
        </div>
      )}
    </div>
  )
}
