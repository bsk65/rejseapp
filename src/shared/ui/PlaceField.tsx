import { useState } from 'react'
import type { Place } from '../types/place'
import { PlaceSearchInput } from './PlaceSearchInput'
import styles from './PlaceField.module.css'

export function PlaceField({
  label,
  place,
  onSelect,
}: {
  label: string
  place: Place | undefined
  onSelect: (place: Place) => void
}) {
  const [editing, setEditing] = useState(false)

  if (place && !editing) {
    return (
      <button type="button" className={styles.chip} onClick={() => setEditing(true)}>
        {label}: {place.name}
      </button>
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
