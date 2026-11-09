import { useState } from 'react'
import { updateTripGuests, updateTripMembers } from '../repository'

export function useUpdateTripMembers() {
  const [pending, setPending] = useState(false)

  async function saveMembers(
    tripId: string,
    ownerUid: string,
    memberUids: string[],
    guestUids: string[],
  ): Promise<void> {
    setPending(true)
    try {
      await updateTripMembers(tripId, ownerUid, memberUids)
      // Kun medlemmer kan kigge med — en, der ikke længere er med, ryger også ud her.
      await updateTripGuests(
        tripId,
        guestUids.filter((uid) => memberUids.includes(uid)),
      )
    } finally {
      setPending(false)
    }
  }

  return { saveMembers, pending }
}
