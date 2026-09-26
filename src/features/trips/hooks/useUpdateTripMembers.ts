import { useState } from 'react'
import { updateTripMembers } from '../repository'

export function useUpdateTripMembers() {
  const [pending, setPending] = useState(false)

  async function saveMembers(
    tripId: string,
    ownerUid: string,
    memberUids: string[],
  ): Promise<void> {
    setPending(true)
    try {
      await updateTripMembers(tripId, ownerUid, memberUids)
    } finally {
      setPending(false)
    }
  }

  return { saveMembers, pending }
}
