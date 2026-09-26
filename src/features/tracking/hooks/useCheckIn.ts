import { useState } from 'react'
import type { Place } from '../../../shared/types/place'
import { getCurrentFix } from '../geolocation'
import type { GpsFix } from '../logic/shouldRecordPoint'

/** Manuelt check-in — enten på den aktuelle GPS-position eller et søgt sted. */
export function useCheckIn(
  record: (fix: GpsFix, source: 'manuel', label?: string) => Promise<boolean>,
) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function checkInHere(): Promise<void> {
    setPending(true)
    setError(null)
    try {
      await record(await getCurrentFix(), 'manuel')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke finde din position.')
    } finally {
      setPending(false)
    }
  }

  async function checkInAt(place: Place): Promise<void> {
    setPending(true)
    setError(null)
    try {
      await record(
        { lat: place.lat, lng: place.lng, timestamp: new Date().toISOString() },
        'manuel',
        place.name,
      )
    } finally {
      setPending(false)
    }
  }

  return { checkInHere, checkInAt, pending, error }
}
