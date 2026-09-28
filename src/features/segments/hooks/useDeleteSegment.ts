import { useState } from 'react'
import { deleteSegment } from '../repository'
import type { BoardingPassImage } from '../types'

export function useDeleteSegment() {
  const [pending, setPending] = useState(false)

  async function removeSegment(
    tripId: string,
    dayId: string,
    segmentId: string,
    boardingPasses?: BoardingPassImage[],
  ): Promise<void> {
    setPending(true)
    try {
      await deleteSegment(tripId, dayId, segmentId, boardingPasses)
    } finally {
      setPending(false)
    }
  }

  return { removeSegment, pending }
}
