import { describeSegment } from '../logic/describeSegment'
import type { Segment } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './SegmentList.module.css'

export function SegmentList({
  segments,
  onSelect,
}: {
  segments: Segment[]
  onSelect: (segment: Segment) => void
}) {
  if (segments.length === 0) {
    return null
  }

  return (
    <ul className={styles.list}>
      {segments.map((segment) => (
        <li key={segment.id}>
          <button type="button" className={styles.item} onClick={() => onSelect(segment)}>
            <TransportModeIcon mode={segment.mode} />
            <span>{describeSegment(segment)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
