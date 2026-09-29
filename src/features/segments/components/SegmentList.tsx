import { useT } from '../../../shared/i18n/useT'
import { describeSegment } from '../logic/describeSegment'
import type { Segment } from '../types'
import { TransportModeIcon } from './TransportModeIcon'
import { TravelersTag } from './TravelersTag'
import styles from './SegmentList.module.css'

/** Dagens transport som tydelige kort (samme form som overnatningerne) — tryk for detaljer. */
export function SegmentList({
  segments,
  onSelect,
}: {
  segments: Segment[]
  onSelect: (segment: Segment) => void
}) {
  const { t } = useT()
  if (segments.length === 0) {
    return null
  }

  return (
    <ul className={styles.list}>
      {segments.map((segment) => {
        const { title, detail } = describeSegment(segment, t)
        return (
          <li key={segment.id}>
            <button type="button" className={styles.item} onClick={() => onSelect(segment)}>
              <TransportModeIcon mode={segment.mode} />
              <span className={styles.text}>
                <span className={styles.title}>{title}</span>
                <span className={styles.detail}>{detail}</span>
                <TravelersTag segment={segment} />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
