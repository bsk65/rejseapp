import { useState } from 'react'
import { priceForSave } from '../../../shared/api/exchangeRates'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { Button } from '../../../shared/ui/Button'
import { PlaceField } from '../../../shared/ui/PlaceField'
import { PriceField } from '../../../shared/ui/PriceField'
import { TextField } from '../../../shared/ui/TextField'
import type { Place } from '../../../shared/types/place'
import { useSaveStay } from '../hooks/useSaveStay'
import { validateStayDates } from '../logic/stayDates'
import type { Stay, StayDetails } from '../types'
import { StayConfirmationPaste } from './StayConfirmationPaste'
import styles from './StayForm.module.css'

type TextFieldKey = 'name' | 'bookingRef' | 'accessCode' | 'wifi' | 'hostPhone' | 'note'

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
    price: stay.price,
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
  const { t } = useT()
  const [details, setDetails] = useState<StayDetails>(() =>
    stay
      ? detailsOf(stay)
      : { name: '', checkInDate: initialCheckIn ?? '', checkOutDate: initialCheckOut ?? '' },
  )
  const [useAsDayTo, setUseAsDayTo] = useState(true)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [priceInvalid, setPriceInvalid] = useState(false)
  // Kursopslaget tager et øjeblik — Gem må ikke kunne trykkes to gange imens.
  const [converting, setConverting] = useState(false)
  const [showPaste, setShowPaste] = useState(false)
  const [validationError, setValidationError] = useState<TextKey | null>(null)
  const { create, update, remove, pending, error } = useSaveStay(tripId)

  function set<K extends keyof StayDetails>(field: K, value: StayDetails[K]) {
    setDetails((prev) => ({ ...prev, [field]: value }))
  }

  function textField(key: TextFieldKey, label: string, type = 'text') {
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
    if (!name) return setValidationError('stays.errorName')
    if (dateError) return setValidationError(dateError)
    if (priceInvalid) return setValidationError('costs.amountInvalid')
    setValidationError(null)

    setConverting(true)
    const price = await priceForSave(details.price, stay?.price)
    setConverting(false)
    const toSave = { ...details, name, price }
    const saved = stay ? await update(stay.id, toSave) : await create(userUid, memberUids, toSave)
    if (!saved) return
    if (!stay && setAsDayTo && useAsDayTo && details.place) await setAsDayTo(details.place)
    onClose()
  }

  const shownError = validationError ?? error

  async function handleDelete() {
    if (stay && (await remove(stay.id))) onClose()
  }

  return (
    <div className={styles.form}>
      <div className={styles.titleRow}>
        <p className={styles.title}>{stay ? t('stays.stay') : t('stays.newStay')}</p>
        <button
          type="button"
          className={styles.pasteToggle}
          onClick={() => setShowPaste((prev) => !prev)}
        >
          {showPaste ? t('stays.pasteHide') : t('stays.pasteShow')}
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
        label={t('stays.name')}
        value={details.name}
        onChange={(e) => set('name', e.target.value)}
      />
      <PlaceField
        label={t('stays.address')}
        place={details.place}
        onSelect={(place) => set('place', place)}
      />
      {!stay && setAsDayTo && details.place && (
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={useAsDayTo}
            onChange={(e) => setUseAsDayTo(e.target.checked)}
          />
          {t('stays.useAsDayTo')}
        </label>
      )}

      <div className={styles.pair}>
        <TextField
          id="stay-checkin-date"
          label={t('stays.checkIn')}
          type="date"
          value={details.checkInDate}
          onChange={(e) => set('checkInDate', e.target.value)}
        />
        <TextField
          id="stay-checkin-time"
          label={t('stays.checkInFrom')}
          type="time"
          value={details.checkInTime ?? ''}
          onChange={(e) => set('checkInTime', e.target.value || undefined)}
        />
      </div>
      <div className={styles.pair}>
        <TextField
          id="stay-checkout-date"
          label={t('stays.checkOut')}
          type="date"
          value={details.checkOutDate}
          onChange={(e) => set('checkOutDate', e.target.value)}
        />
        <TextField
          id="stay-checkout-time"
          label={t('stays.checkOutBy')}
          type="time"
          value={details.checkOutTime ?? ''}
          onChange={(e) => set('checkOutTime', e.target.value || undefined)}
        />
      </div>

      {textField('bookingRef', t('stays.bookingRef'))}
      <PriceField
        id="stay-price"
        price={details.price}
        onChange={(price) => set('price', price)}
        onInvalidChange={setPriceInvalid}
      />
      {textField('accessCode', t('stays.accessCode'))}
      {textField('wifi', t('stays.wifi'))}
      {textField('hostPhone', t('stays.hostPhone'), 'tel')}
      {textField('note', t('stays.note'))}

      {shownError && <p className={styles.error}>{t(shownError)}</p>}

      {confirmingDelete ? (
        <div className={styles.confirmDelete}>
          <p className={styles.confirmText}>{t('stays.deleteConfirm', { name: details.name })}</p>
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
              {t('stays.deleteYes')}
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
