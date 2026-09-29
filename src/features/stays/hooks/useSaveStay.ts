import { useState } from 'react'
import type { TextKey } from '../../../shared/i18n/translator'
import { createStay, deleteStay, updateStay } from '../repository'
import type { StayDetails } from '../types'

/** Opret, gem og slet overnatninger — med fælles pending/fejl-tilstand til formularen. */
export function useSaveStay(tripId: string) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<TextKey | null>(null)

  async function run(action: () => Promise<void>): Promise<boolean> {
    setPending(true)
    setError(null)
    try {
      await action()
      return true
    } catch {
      setError('stays.errorSave')
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
