import { useState } from 'react'
import { createStay, deleteStay, updateStay } from '../repository'
import type { StayDetails } from '../types'

/** Opret, gem og slet overnatninger — med fælles pending/fejl-tilstand til formularen. */
export function useSaveStay(tripId: string) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      await action()
      return true
    } catch (err) {
      setError('Kunne ikke gemme: ' + (err instanceof Error ? err.message : String(err)))
      return false
    } finally {
      setPending(false)
    }
  }

  return {
    pending,
    error,
    create: (creatorUid: string, memberUids: string[], details: StayDetails) =>
      run(() => createStay(tripId, creatorUid, memberUids, details)),
    update: (stayId: string, details: StayDetails) =>
      run(() => updateStay(tripId, stayId, details)),
    remove: (stayId: string) => run(() => deleteStay(tripId, stayId)),
  }
}
