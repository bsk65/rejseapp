import { useState } from 'react'
import { searchPlaces } from '../../../shared/api/nominatim'
import { Button } from '../../../shared/ui/Button'
import type { Place } from '../../../shared/types/place'
import { parseStayConfirmation, type ParsedStay } from '../logic/parseStayConfirmation'
import type { StayDetails } from '../types'
import styles from './StayConfirmationPaste.module.css'

const FIELD_NAMES: Partial<Record<keyof ParsedStay, string>> = {
  name: 'navn',
  address: 'adresse',
  checkInDate: 'indtjek',
  checkOutDate: 'udtjek',
  bookingRef: 'bookingnummer',
  hostPhone: 'telefon',
  accessCode: 'dørkode',
  wifi: 'wifi',
}

/**
 * "Indsæt bekræftelse": teksten fra en Booking-, Airbnb- eller hotelmail
 * udfylder formularens felter. Adressen slås op som sted (første resultat).
 */
export function StayConfirmationPaste({
  referenceDate,
  onFill,
}: {
  /** Bruges til at gætte året, hvis bekræftelsen ikke skriver det. */
  referenceDate: string
  onFill: (details: Partial<StayDetails>) => void
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFill() {
    const result = parseStayConfirmation(text, referenceDate)
    const { address, ...parsed } = result
    const found = (Object.keys(result) as (keyof ParsedStay)[])
      .map((key) => FIELD_NAMES[key])
      .filter(Boolean)

    if (found.length === 0) {
      setMessage('Kunne ikke finde noget i teksten. Udfyld felterne selv.')
      return
    }

    setBusy(true)
    let place: Place | undefined
    let addressNote = ''
    if (address) {
      place = (await searchPlaces(address).catch(() => []))[0]
      if (!place) addressNote = ` Adressen “${address}” blev ikke fundet — søg den selv.`
    }
    setBusy(false)

    onFill({ ...parsed, ...(place ? { place } : {}) })
    setText('')
    setMessage(`Udfyldt: ${found.join(', ')}. Tjek felterne, og tryk Gem.${addressNote}`)
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor="stay-confirmation">
        Indsæt bekræftelse (Booking, Airbnb, hotel)
      </label>
      <textarea
        id="stay-confirmation"
        className={styles.textarea}
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Kopiér teksten fra bekræftelsesmailen, og sæt den ind her…"
      />
      <Button
        type="button"
        variant="secondary"
        disabled={!text.trim() || busy}
        onClick={() => void handleFill()}
      >
        {busy ? 'Slår adressen op…' : 'Udfyld felterne'}
      </Button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}
