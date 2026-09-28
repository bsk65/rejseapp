import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { PlaceField } from '../../../shared/ui/PlaceField'
import { TextField } from '../../../shared/ui/TextField'
import type { Place } from '../../../shared/types/place'
import { useSaveStay } from '../hooks/useSaveStay'
import { validateStayDates } from '../logic/stayDates'
import type { Stay, StayDetails } from '../types'
import { StayConfirmationPaste } from './StayConfirmationPaste'
import styles from './StayForm.module.css'

type TextKey = 'name' | 'bookingRef' | 'accessCode' | 'wifi' | 'hostPhone' | 'note'

/** Kun de redigerbare felter — id/ownerUid/memberUids må ikke skrives med tilbage. */
function detailsOf(stay: Stay): StayDetails {
  return {
    name: stay.name,
    place: stay.place,
    checkInDate: stay.checkInDate,
    checkInTime: stay.checkInTime,
    checkOutDate: stay.checkOutDate,
    checkOutTime: stay.checkOutTime,
    bookingRef: stay.bookingRef,
    accessCode: stay.accessCode,
    wifi: stay.wifi,
    hostPhone: stay.hostPhone,
    note: stay.note,
  }
}

/**
 * Opret eller ret en overnatning. `setAsDayTo`: tilbyd (ved oprettelse) at
 * sætte adressen som indtjekningsdagens "Til".
 */
export function StayForm({
  tripId,
  userUid,
  memberUids,
  stay,
  initialCheckIn,
  initialCheckOut,
  setAsDayTo,
  onClose,
}: {
  tripId: string
  userUid: string
  memberUids: string[]
  /** Findes den, rettes den — ellers oprettes en ny. */
  stay?: Stay
  initialCheckIn?: string
  initialCheckOut?: string
  setAsDayTo?: (place: Place) => Promise<void>
  onClose: () => void
}) {
  const [details, setDetails] = useState<StayDetails>(() =>
    stay
      ? detailsOf(stay)
      : { name: '', checkInDate: initialCheckIn ?? '', checkOutDate: initialCheckOut ?? '' },
  )
  const [useAsDayTo, setUseAsDayTo] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { create, update, remove, pending, error } = useSaveStay(tripId)

  function set<K extends keyof StayDetails>(field: K, value: StayDetails[K]) {
    setDetails((prev) => ({ ...prev, [field]: value }))
  }

  function textField(key: TextKey, label: string, type = 'text') {
    return (
      <TextField
        id={`stay-${key}`}
        label={label}
        type={type}
        value={details[key] ?? ''}
        onChange={(e) => set(key, e.target.value || undefined)}
      />
    )
  }

  async function handleSave() {
    const name = details.name.trim() || details.place?.name || ''
    const dateError = validateStayDates(details.checkInDate, details.checkOutDate)
    if (!name) return setValidationError('Skriv et navn eller vælg en adresse.')
    if (dateError) return setValidationError(dateError)
    setValidationError(null)

    const toSave = { ...details, name }
    const saved = stay ? await update(stay.id, toSave) : await create(userUid, memberUids, toSave)
    if (!saved) return
    if (!stay && setAsDayTo && useAsDayTo && details.place) await setAsDayTo(details.place)
    onClose()
  }

  async function handleDelete() {
    if (stay && (await remove(stay.id))) onClose()
  }

  return (
    <div className={styles.form}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{stay ? 'Overnatning' : 'Ny overnatning'}</p>
        <button
          type="button"
          className={styles.pasteToggle}
          onClick={() => setShowPaste((prev) => !prev)}
        >
          {showPaste ? 'Skjul indsæt' : 'Indsæt bekræftelse'}
        </button>
      </div>
      {showPaste && (
        <StayConfirmationPaste
          referenceDate={
            details.checkInDate || initialCheckIn || new Date().toISOString().slice(0, 10)
          }
          onFill={(filled) => setDetails((prev) => ({ ...prev, ...filled }))}
        />
      )}

      <TextField
        id="stay-name"
        label="Navn (hotel, Airbnb …)"
        value={details.name}
        onChange={(e) => set('name', e.target.value)}
      />
      <PlaceField label="Adresse" place={details.place} onSelect={(place) => set('place', place)} />
      {!stay && setAsDayTo && details.place && (
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={useAsDayTo}
            onChange={(e) => setUseAsDayTo(e.target.checked)}
          />
          Brug adressen som dagens “Til”
        </label>
      )}

      <div className={styles.pair}>
        <TextField
          id="stay-checkin-date"
          label="Indtjek"
          type="date"
          value={details.checkInDate}
          onChange={(e) => set('checkInDate', e.target.value)}
        />
        <TextField
          id="stay-checkin-time"
          label="Fra kl."
          type="time"
          value={details.checkInTime ?? ''}
          onChange={(e) => set('checkInTime', e.target.value || undefined)}
        />
      </div>
      <div className={styles.pair}>
        <TextField
          id="stay-checkout-date"
          label="Udtjek"
          type="date"
          value={details.checkOutDate}
          onChange={(e) => set('checkOutDate', e.target.value)}
        />
        <TextField
          id="stay-checkout-time"
          label="Senest kl."
          type="time"
          value={details.checkOutTime ?? ''}
          onChange={(e) => set('checkOutTime', e.target.value || undefined)}
        />
      </div>

      {textField('bookingRef', 'Bookingnummer')}
      {textField('accessCode', 'Dørkode / nøgleboks')}
      {textField('wifi', 'Wifi (netværk og kode)')}
      {textField('hostPhone', 'Telefon til vært/reception', 'tel')}
      {textField('note', 'Note')}

      {(validationError ?? error) && <p className={styles.error}>{validationError ?? error}</p>}

      {confirmingDelete ? (
        <div className={styles.confirmDelete}>
          <p className={styles.confirmText}>Slet overnatningen “{details.name}” helt?</p>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
              Fortryd
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => void handleDelete()}
            >
              Ja, slet
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {stay && (
            <Button
              type="button"
              variant="danger"
              className={styles.deleteButton}
              onClick={() => setConfirmingDelete(true)}
            >
              Slet
            </Button>
          )}
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
