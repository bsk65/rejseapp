import { useState } from 'react'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { useCreateSegment } from '../hooks/useCreateSegment'
import type { Segment } from '../types'
import { PasteItinerary } from './PasteItinerary'
import { SegmentDetailForm } from './SegmentDetailForm'
import { SegmentList } from './SegmentList'
import { SegmentModeButtons } from './SegmentModeButtons'
import styles from './DaySegments.module.css'

export function DaySegments({
  tripId,
  dayId,
  dayDate,
  memberUids,
  segments,
}: {
  tripId: string
  dayId: string
  dayDate: string
  memberUids: string[]
  /** Dagens segmenter — hentes af dagen selv (DayRow), som også viser dem i resuméet. */
  segments: Segment[]
}) {
  const { user } = useAuthUser()
  const { addSegment, pending } = useCreateSegment()
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [showPaste, setShowPaste] = useState(false)

  if (!user) return null

  return (
    <div className={styles.wrapper}>
      <SegmentList segments={segments} onSelect={setSelectedSegment} />

      {selectedSegment && (
        <SegmentDetailForm
          tripId={tripId}
          dayId={dayId}
          dayDate={dayDate}
          segment={selectedSegment}
          onClose={() => setSelectedSegment(null)}
        />
      )}

      <SegmentModeButtons
        disabled={pending}
        onAdd={(mode) => void addSegment(tripId, dayId, user.uid, memberUids, mode)}
      />

      <button
        type="button"
        className={styles.pasteToggle}
        onClick={() => setShowPaste((prev) => !prev)}
      >
        {showPaste ? 'Skjul indsæt rejseplan' : 'Indsæt rejseplan'}
      </button>

      {showPaste && (
        <PasteItinerary
          tripId={tripId}
          dayId={dayId}
          creatorUid={user.uid}
          memberUids={memberUids}
          onDone={() => setShowPaste(false)}
        />
      )}
    </div>
  )
}
