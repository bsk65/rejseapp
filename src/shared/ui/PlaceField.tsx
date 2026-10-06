import { useState } from 'react'
import type { Place } from '../types/place'
import { placeLabel } from '../utils/placeLabel'
import { PlaceSearchInput } from './PlaceSearchInput'
import styles from './PlaceField.module.css'

export function PlaceField({
  label,
  place,
  onSelect,
  onClear,
  clearLabel,
}: {
  label: string
  place: Place | undefined
  onSelect: (place: Place) => void
  /** Sat = der vises et kryds ved siden af stedet, som fjerner det. */
  onClear?: () => void
  /** Skærmlæser-tekst for krydset, f.eks. "Fjern Til". */
  clearLabel?: string
}) {
  const [editing, setEditing] = useState(false)

  if (place && !editing) {
    const chip = (
      <button type="button" className={styles.chip} onClick={() => setEditing(true)}>
        {label}: {placeLabel(place)}
      </button>
    )
    if (!onClear) return chip
    return (
      <div className={styles.row}>
        {chip}
        <button
          type="button"
          className={styles.clear}
          aria-label={clearLabel}
          title={clearLabel}
          onClick={onClear}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <PlaceSearchInput
      label={label}
      onSelect={(selected) => {
        onSelect(selected)
        setEditing(false)
      }}
    />
  )
}
