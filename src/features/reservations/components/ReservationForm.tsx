import { useState } from 'react'
import { priceForSave } from '../../../shared/api/exchangeRates'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { PlaceField } from '../../../shared/ui/PlaceField'
import { PriceField } from '../../../shared/ui/PriceField'
import { TextField } from '../../../shared/ui/TextField'
import { useSaveReservation } from '../hooks/useSaveReservation'
import {
  RESERVATION_KINDS,
  reservationKindIcon,
  reservationKindLabel,
  type Reservation,
  type ReservationDetails,
} from '../types'
import styles from './ReservationForm.module.css'

type TextFieldKey = 'bookingRef' | 'phone' | 'note'

/** Kun de redigerbare felter — id/ownerUid/memberUids må ikke skrives med tilbage. */
function detailsOf(reservation: Reservation): ReservationDetails {
  return {
    kind: reservation.kind,
    name: reservation.name,
    place: reservation.place,
    date: reservation.date,
    time: reservation.time,
    bookingRef: reservation.bookingRef,
    phone: reservation.phone,
    note: reservation.note,
    price: reservation.price,
  }
}

/** Opret eller ret en reservation (restaurant, aktivitet …). */
export function ReservationForm({
  tripId,
  userUid,
  memberUids,
  reservation,
  initialDate,
  onClose,
}: {
  tripId: string
  userUid: string
  memberUids: string[]
  /** Findes den, rettes den — ellers oprettes en ny. */
  reservation?: Reservation
  initialDate?: string
  onClose: () => void
}) {
  const { t } = useT()
  const [details, setDetails] = useState<ReservationDetails>(() =>
    reservation
      ? detailsOf(reservation)
      : { kind: 'restaurant', name: '', date: initialDate ?? '' },
  )
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [priceInvalid, setPriceInvalid] = useState(false)
  // Kursopslaget tager et øjeblik — Gem må ikke kunne trykkes to gange imens.
  const [converting, setConverting] = useState(false)
  const [validationError, setValidationError] = useState<TextKey | null>(null)
  const { create, update, remove, pending, error } = useSaveReservation(tripId)

  function set<K extends keyof ReservationDetails>(field: K, value: ReservationDetails[K]) {
    setDetails((prev) => ({ ...prev, [field]: value }))
  }

  function textField(key: TextFieldKey, label: string, type = 'text') {
    return (
      <TextField
        id={`reservation-${key}`}
        label={label}
        type={type}
        value={details[key] ?? ''}
        onChange={(e) => set(key, e.target.value || undefined)}
      />
    )
  }

  async function handleSave() {
    const name = details.name.trim() || details.place?.name || ''
    if (!name) return setValidationError('reservations.errorName')
    if (!details.date) return setValidationError('reservations.errorDate')
    if (priceInvalid) return setValidationError('costs.amountInvalid')
    setValidationError(null)

    setConverting(true)
    const price = await priceForSave(details.price, reservation?.price)
    setConverting(false)
    const toSave = { ...details, name, price }
    const saved = reservation
      ? await update(reservation.id, toSave)
      : await create(userUid, memberUids, toSave)
    if (saved) onClose()
  }

  async function handleDelete() {
    if (reservation && (await remove(reservation.id))) onClose()
  }

  const shownError = validationError ?? error

  return (
    <div className={styles.form}>
      <p className={styles.title}>
        {reservation ? t('reservations.reservation') : t('reservations.newReservation')}
      </p>

      <div className={styles.kinds} role="group" aria-label={t('reservations.kind')}>
        {RESERVATION_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className={styles.kind}
            data-active={details.kind === kind}
            onClick={() => set('kind', kind)}
          >
            <span aria-hidden="true">{reservationKindIcon[kind]}</span>
            {t(reservationKindLabel[kind])}
          </button>
        ))}
      </div>

      <TextField
        id="reservation-name"
        label={t('reservations.name')}
        value={details.name}
        onChange={(e) => set('name', e.target.value)}
      />
      <PlaceField
        label={t('reservations.address')}
        place={details.place}
        onSelect={(place) => set('place', place)}
        onClear={() => set('place', undefined)}
        clearLabel={t('days.clearPlace', { label: t('reservations.address') })}
      />

      <div className={styles.pair}>
        <TextField
          id="reservation-date"
          label={t('reservations.date')}
          type="date"
          value={details.date}
          onChange={(e) => set('date', e.target.value)}
        />
        <TextField
          id="reservation-time"
          label={t('reservations.time')}
          type="time"
          value={details.time ?? ''}
          onChange={(e) => set('time', e.target.value || undefined)}
        />
      </div>

      {textField('bookingRef', t('reservations.bookingRef'))}
      {textField('phone', t('reservations.phone'), 'tel')}
      <PriceField
        id="reservation-price"
        price={details.price}
        onChange={(price) => set('price', price)}
        onInvalidChange={setPriceInvalid}
      />
      {textField('note', t('reservations.note'))}

      {shownError && <p className={styles.error}>{t(shownError)}</p>}

      {confirmingDelete ? (
        <div className={styles.confirmDelete}>
          <p className={styles.confirmText}>
            {t('reservations.deleteConfirm', { name: details.name })}
          </p>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
              {t('common.undo')}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => void handleDelete()}
            >
              {t('reservations.deleteYes')}
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {reservation && (
            <Button
              type="button"
              variant="danger"
              className={styles.deleteButton}
              onClick={() => setConfirmingDelete(true)}
            >
              {t('common.delete')}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" disabled={pending || converting} onClick={() => void handleSave()}>
            {t('common.save')}
          </Button>
        </div>
      )}
    </div>
  )
}
