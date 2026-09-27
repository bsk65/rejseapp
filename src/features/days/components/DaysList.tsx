import type { Photo } from '../../photos/types'
import type { Day } from '../types'
import { DayRow } from './DayRow'
import styles from './DaysList.module.css'

export function DaysList({
  tripId,
  memberUids,
  days,
  photos,
  loading,
  highlightedDayId,
}: {
  tripId: string
  memberUids: string[]
  days: Day[]
  photos: Photo[]
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
      {days.map((day, index) => (
        <DayRow
          key={day.id}
          tripId={tripId}
          memberUids={memberUids}
          day={day}
          previousDay={days[index - 1]}
          nextDay={days[index + 1]}
          photos={photos.filter((photo) => photo.dayId === day.id)}
          highlighted={day.id === highlightedDayId}
        />
      ))}
    </ul>
  )
}
