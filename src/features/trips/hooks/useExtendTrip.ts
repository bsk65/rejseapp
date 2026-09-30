import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { extendTrip } from '../repository'
import type { TripExtension } from '../logic/extendTrip'

/** Tilføjer dage før start og/eller efter slut. Alle rejsens medlemmer må. */
export function useExtendTrip() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<TextKey | null>(null)

  async function extend(
    tripId: string,
    creatorUid: string,
    memberUids: string[],
    plan: TripExtension,
  ): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      await extendTrip(tripId, creatorUid, memberUids, plan)
      return true
    } catch {
      setError('trips.errorExtend')
      return false
    } finally {
      setPending(false)
    }
  }

  return { extend, pending, error }
}
