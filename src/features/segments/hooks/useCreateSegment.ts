import { useState } from 'react'
import { createSegment } from '../repository'
import type { SegmentDetails, TransportMode } from '../types'

export function useCreateSegment() {
  const [pending, setPending] = useState(false)

  async function addSegment(
    tripId: string,
    dayId: string,
    ownerUid: string,
    mode: TransportMode,
    details?: Partial<SegmentDetails>,
  ): Promise<void> {
    setPending(true)
    try {
      await createSegment(tripId, dayId, ownerUid, mode, details)
    } finally {
      setPending(false)
    }
  }

  return { addSegment, pending }
}
