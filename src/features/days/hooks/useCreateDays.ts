import { useState } from 'react'
import { createDaysForTrip } from '../repository'

export function useCreateDays() {
  const [pending, setPending] = useState(false)

  async function createDays(
    tripId: string,
    creatorUid: string,
    memberUids: string[],
    numDays: number,
    startDate: string,
  ): Promise<void> {
    setPending(true)
    try {
      await createDaysForTrip(tripId, creatorUid, memberUids, numDays, startDate)
    } finally {
      setPending(false)
    }
  }

  return { createDays, pending }
}
