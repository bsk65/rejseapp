import { useState } from 'react'
import { moveSegment, updateSegment } from '../repository'
import type { Segment, SegmentDetails } from '../types'

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

  /** Gemmer og flytter samtidig segmentet til en anden dag. */
  async function saveAndMoveSegment(
    tripId: string,
    fromDayId: string,
    toDayId: string,
    segment: Segment,
    patch: Partial<SegmentDetails>,
  ): Promise<void> {
    setPending(true)
    try {
      await moveSegment(tripId, fromDayId, toDayId, segment, patch)
    } finally {
      setPending(false)
    }
  }

  return { saveSegment, saveAndMoveSegment, pending }
}
