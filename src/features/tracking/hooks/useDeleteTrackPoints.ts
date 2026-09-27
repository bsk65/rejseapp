import { useState } from 'react'
import { deleteTrackPoints } from '../repository'

/** Sletter et helt importeret spor. `pendingIds` er import-id'et, der slettes lige nu. */
export function useDeleteTrackPoints() {
  const [pendingIds, setPendingIds] = useState<string | null>(null)

  async function remove(tripId: string, importId: string, pointIds: string[]): Promise<void> {
    setPendingIds(importId)
    try {
      await deleteTrackPoints(tripId, pointIds)
    } finally {
      setPendingIds(null)
    }
  }

  return { remove, pendingIds }
}
