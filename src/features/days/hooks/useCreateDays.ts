import { useState } from 'react'
import { createDaysForTrip } from '../repository'

export function useCreateDays() {
  const [pending, setPending] = useState(false)

  async function createDays(
    tripId: string,
    ownerUid: string,
    numDays: number,
    startDate: string,
  ): Promise<void> {
    setPending(true)
    try {
      await createDaysForTrip(tripId, ownerUid, numDays, startDate)
    } finally {
      setPending(false)
    }
  }

  return { createDays, pending }
}
