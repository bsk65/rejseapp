import { useNow } from '../../../shared/hooks/useNow'
import { localIsoDate } from '../../../shared/utils/date'
import type { Photo } from '../../photos/types'
import type { Stay } from '../../stays/types'
import { useExpandedDays } from '../hooks/useExpandedDays'
import type { Day } from '../types'
import { DayRow } from './DayRow'
import styles from './DaysList.module.css'

export function DaysList({
  tripId,
  memberUids,
  userUid,
  stays,
  days,
  photos,
  loading,
  highlightedDayId,
}: {
  tripId: string
  memberUids: string[]
  userUid: string
  stays: Stay[]
  days: Day[]
  photos: Photo[]
  loading: boolean
  highlightedDayId: string | null
}) {
  const today = localIsoDate(useNow().getTime())
  const { isExpanded, toggle, allExpanded, toggleAll } = useExpandedDays(
    days,
    highlightedDayId,
    today,
  )

  if (loading) {
    return <p className={styles.status}>Henter dage…</p>
  }

  if (days.length === 0) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.toggleAll} onClick={toggleAll}>
        {allExpanded ? 'Fold alle dage sammen' : 'Fold alle dage ud'}
      </button>
      <ul className={styles.list}>
        {days.map((day, index) => (
          <DayRow
            key={day.id}
            tripId={tripId}
            memberUids={memberUids}
            userUid={userUid}
            stays={stays}
            day={day}
            previousDay={days[index - 1]}
            nextDay={days[index + 1]}
            photos={photos.filter((photo) => photo.dayId === day.id)}
            highlighted={day.id === highlightedDayId}
            expanded={isExpanded(day.id)}
            isToday={day.date === today}
            onToggle={() => toggle(day.id)}
          />
        ))}
      </ul>
    </div>
  )
}
