import { useState } from 'react'
import { cascadePhotoSharing } from '../../photos/repository'
import { cascadeTrackSharing } from '../../tracking/repository'
import { updateTripSharedCategories } from '../repository'
import type { SharedCategories } from '../types'

export function useUpdateSharedCategories() {
  const [pending, setPending] = useState(false)

  async function saveSharedCategories(
    tripId: string,
    ownerUid: string,
    memberUids: string[],
    sharedCategories: SharedCategories,
  ): Promise<void> {
    setPending(true)
    try {
      await updateTripSharedCategories(tripId, sharedCategories)
      await Promise.all([
        cascadePhotoSharing(tripId, sharedCategories.photos, memberUids, ownerUid),
        cascadeTrackSharing(tripId, sharedCategories.track, memberUids, ownerUid),
      ])
    } finally {
      setPending(false)
    }
  }

  return { saveSharedCategories, pending }
}
