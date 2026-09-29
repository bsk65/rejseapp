import { useCallback, useState } from 'react'
import type { Message } from '../../../shared/i18n/message'
import { computeViewerUids } from '../../../shared/utils/computeViewerUids'
import type { GpsFix } from '../logic/shouldRecordPoint'
import { addTrackPoint } from '../repository'
import type { TrackSource, TrackingContext } from '../types'

export function useRecordTrackPoint({
  tripId,
  userUid,
  tripOwnerUid,
  memberUids,
  shareTrack,
}: TrackingContext) {
  const [error, setError] = useState<Message | null>(null)

  const record = useCallback(
    async (fix: GpsFix, source: TrackSource, label?: string): Promise<boolean> => {
      setError(null)
      try {
        await addTrackPoint(tripId, {
          lat: fix.lat,
          lng: fix.lng,
          timestamp: fix.timestamp,
          source,
          label,
          ownerUid: userUid,
          trackViewerUids: computeViewerUids(shareTrack, memberUids, tripOwnerUid, userUid),
        })
        return true
      } catch {
        setError({ key: 'tracking.errorSavePosition' })
        return false
      }
    },
    [tripId, userUid, tripOwnerUid, memberUids, shareTrack],
  )

  return { record, error }
}
