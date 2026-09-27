import { useState } from 'react'
import { deleteSegment } from '../repository'

export function useDeleteSegment() {
  const [pending, setPending] = useState(false)

  async function removeSegment(tripId: string, dayId: string, segmentId: string): Promise<void> {
    setPending(true)
    try {
      await deleteSegment(tripId, dayId, segmentId)
    } finally {
      setPending(false)
    }
  }

  return { removeSegment, pending }
}
