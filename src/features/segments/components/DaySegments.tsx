import { useCreateSegment } from '../hooks/useCreateSegment'
import { useSegments } from '../hooks/useSegments'
import { SegmentList } from './SegmentList'
import { SegmentModeButtons } from './SegmentModeButtons'

export function DaySegments({
  tripId,
  dayId,
  ownerUid,
}: {
  tripId: string
  dayId: string
  ownerUid: string
}) {
  const { segments } = useSegments(tripId, dayId, ownerUid)
  const { addSegment, pending } = useCreateSegment()

  return (
    <div>
      <SegmentList segments={segments} />
      <SegmentModeButtons
        disabled={pending}
        onAdd={(mode) => void addSegment(tripId, dayId, ownerUid, mode)}
      />
    </div>
  )
}
