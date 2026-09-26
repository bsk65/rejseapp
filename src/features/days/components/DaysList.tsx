import type { Day } from '../types'
import { DayRow } from './DayRow'
import styles from './DaysList.module.css'

export function DaysList({
  tripId,
  memberUids,
  days,
  loading,
  highlightedDayId,
}: {
  tripId: string
  memberUids: string[]
  days: Day[]
  loading: boolean
  highlightedDayId: string | null
}) {
  if (loading) {
    return <p className={styles.status}>Henter dage…</p>
  }

  if (days.length === 0) {
    return null
  }

  return (
    <ul className={styles.list}>
      {days.map((day) => (
        <DayRow
          key={day.id}
          tripId={tripId}
          memberUids={memberUids}
          day={day}
          highlighted={day.id === highlightedDayId}
        />
      ))}
    </ul>
  )
}
