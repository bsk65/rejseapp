import { describeSegment } from '../logic/describeSegment'
import type { Segment } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import styles from './SegmentList.module.css'

/** Dagens transport som tydelige kort (samme form som overnatningerne) — tryk for detaljer. */
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
      {segments.map((segment) => {
        const { title, detail } = describeSegment(segment)
        return (
          <li key={segment.id}>
            <button type="button" className={styles.item} onClick={() => onSelect(segment)}>
              <TransportModeIcon mode={segment.mode} />
              <span className={styles.text}>
                <span className={styles.title}>{title}</span>
                <span className={styles.detail}>{detail}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
