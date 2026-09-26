import { describeSegment } from '../logic/describeSegment'
import type { Segment } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './SegmentList.module.css'

export function SegmentList({ segments }: { segments: Segment[] }) {
  if (segments.length === 0) {
    return null
  }

  return (
    <ul className={styles.list}>
      {segments.map((segment) => (
        <li key={segment.id} className={styles.item}>
          <TransportModeIcon mode={segment.mode} />
          <span>{describeSegment(segment)}</span>
        </li>
      ))}
    </ul>
  )
}
