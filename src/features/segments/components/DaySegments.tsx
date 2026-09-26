import { useState } from 'react'
import { useCreateSegment } from '../hooks/useCreateSegment'
import { useSegments } from '../hooks/useSegments'
import type { Segment } from '../types'
import { PasteItinerary } from './PasteItinerary'
import { SegmentDetailForm } from './SegmentDetailForm'
import { SegmentList } from './SegmentList'
import { SegmentModeButtons } from './SegmentModeButtons'
import styles from './DaySegments.module.css'

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
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
  const [showPaste, setShowPaste] = useState(false)

  return (
    <div className={styles.wrapper}>
      <SegmentList segments={segments} onSelect={setSelectedSegment} />

      {selectedSegment && (
        <SegmentDetailForm
          tripId={tripId}
          dayId={dayId}
          segment={selectedSegment}
          onClose={() => setSelectedSegment(null)}
        />
      )}

      <SegmentModeButtons
        disabled={pending}
        onAdd={(mode) => void addSegment(tripId, dayId, ownerUid, mode)}
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
          ownerUid={ownerUid}
          onDone={() => setShowPaste(false)}
        />
      )}
    </div>
  )
}
