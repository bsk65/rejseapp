import { PlaceField } from '../../../shared/ui/PlaceField'
import { formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import { PhotoGallery } from '../../photos/components/PhotoGallery'
import type { Photo } from '../../photos/types'
import { DaySegments } from '../../segments/components/DaySegments'
import { useDayPlace } from '../hooks/useDayPlace'
import type { Day } from '../types'
import styles from './DayRow.module.css'

export function DayRow({
  tripId,
  memberUids,
  day,
  photos,
  highlighted,
}: {
  tripId: string
  memberUids: string[]
  day: Day
  photos: Photo[]
  highlighted: boolean
}) {
  const { setDayPlace } = useDayPlace()

  return (
    <li
      id={`dag-${day.id}`}
      className={styles.row}
      data-highlighted={highlighted}
      data-day-color={dayColorIndex(day.dayNumber)}
    >
      <div className={styles.header}>
        <span className={styles.dayNumber}>Dag {day.dayNumber}</span>
        <span className={styles.date}>{formatDayDate(day.date)}</span>
      </div>

      <div className={styles.places}>
        <PlaceField
          label="Fra"
          place={day.fromPlace}
          onSelect={(place) => void setDayPlace(tripId, day.id, 'fromPlace', place)}
        />
        <PlaceField
          label="Til"
          place={day.toPlace}
          onSelect={(place) => void setDayPlace(tripId, day.id, 'toPlace', place)}
        />
      </div>

      <PhotoGallery tripId={tripId} photos={photos} />

      <DaySegments tripId={tripId} dayId={day.id} memberUids={memberUids} />
    </li>
  )
}
