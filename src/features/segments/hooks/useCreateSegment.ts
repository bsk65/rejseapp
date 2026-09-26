import { useState } from 'react'
import { createSegment } from '../repository'
import type { TransportMode } from '../types'

export function useCreateSegment() {
  const [pending, setPending] = useState(false)

  async function addSegment(
    tripId: string,
    dayId: string,
    ownerUid: string,
    mode: TransportMode,
  ): Promise<void> {
    setPending(true)
    try {
      await createSegment(tripId, dayId, ownerUid, mode)
    } finally {
      setPending(false)
    }
  }

  return { addSegment, pending }
}
