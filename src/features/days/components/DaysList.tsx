import type { TextKey } from '../../../shared/i18n/translator'
import { useNow } from '../../../shared/hooks/useNow'
import { localIsoDate } from '../../../shared/utils/date'
import type { Photo } from '../../photos/types'
import type { Stay } from '../../stays/types'
import { useExpandedDays } from '../hooks/useExpandedDays'
import type { Day } from '../types'
import { DayRow } from './DayRow'
import { useT } from '../../../shared/i18n/useT'
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
  onDeleteDay,
  deleteError,
}: {
  tripId: string
  memberUids: string[]
  userUid: string
  stays: Stay[]
  days: Day[]
  photos: Photo[]
  loading: boolean
  highlightedDayId: string | null
  /** Sættes kun for rejsens ejer — første og sidste dag får så "Slet dag". */
  onDeleteDay?: (day: Day) => Promise<boolean>
  deleteError: TextKey | null
}) {
  const today = localIsoDate(useNow().getTime())
  const { t } = useT()
  const { isExpanded, toggle, allExpanded, toggleAll } = useExpandedDays(
    days,
    highlightedDayId,
    today,
  )

  if (loading) {
    return <p className={styles.status}>{t('days.loading')}</p>
  }

  if (days.length === 0) {
    return null
  }

  return (
    <div className={styles.wrapper}>
      <button type="button" className={styles.toggleAll} onClick={toggleAll}>
        {allExpanded ? t('days.collapseAll') : t('days.expandAll')}
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
            onDelete={
              onDeleteDay && days.length > 1 && (index === 0 || index === days.length - 1)
                ? () => onDeleteDay(day)
                : undefined
            }
            deleteError={deleteError}
          />
        ))}
      </ul>
    </div>
  )
}
