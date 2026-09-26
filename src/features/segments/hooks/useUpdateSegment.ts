import { useState } from 'react'
import { updateSegment } from '../repository'
import type { SegmentDetails } from '../types'

export function useUpdateSegment() {
  const [pending, setPending] = useState(false)

  async function saveSegment(
    tripId: string,
    dayId: string,
    segmentId: string,
    patch: Partial<SegmentDetails>,
  ): Promise<void> {
    setPending(true)
    try {
      await updateSegment(tripId, dayId, segmentId, patch)
    } finally {
      setPending(false)
    }
  }

  return { saveSegment, pending }
}
