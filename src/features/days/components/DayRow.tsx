import { PlaceField } from '../../../shared/ui/PlaceField'
import { formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import { PhotoGallery } from '../../photos/components/PhotoGallery'
import type { Photo } from '../../photos/types'
import { DaySegments } from '../../segments/components/DaySegments'
import { DayStays } from '../../stays/components/DayStays'
import type { Stay } from '../../stays/types'
import { useDayPlace } from '../hooks/useDayPlace'
import { effectiveFromPlace } from '../logic/followPreviousDay'
import type { Day } from '../types'
import styles from './DayRow.module.css'

export function DayRow({
  tripId,
  memberUids,
  userUid,
  stays,
  day,
  previousDay,
  nextDay,
  photos,
  highlighted,
}: {
  tripId: string
  memberUids: string[]
  userUid: string
  /** Alle rejsens overnatninger — dagen viser selv dem, der berører den. */
  stays: Stay[]
  day: Day
  /** Bruges til at foreslå "Fra" = dagen før's "Til". */
  previousDay: Day | undefined
  /** Får automatisk dagens "Til" som sit "Fra". */
  nextDay: Day | undefined
  photos: Photo[]
  highlighted: boolean
}) {
  const { setFromPlace, setToPlace } = useDayPlace()

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
          place={effectiveFromPlace(day, previousDay)}
          onSelect={(place) => void setFromPlace(tripId, day, place)}
        />
        <PlaceField
          label="Til"
          place={day.toPlace}
          onSelect={(place) => void setToPlace(tripId, day, nextDay, place)}
        />
      </div>

      <PhotoGallery tripId={tripId} photos={photos} />

      <DayStays
        tripId={tripId}
        userUid={userUid}
        memberUids={memberUids}
        date={day.date}
        stays={stays}
        setAsDayTo={(place) => setToPlace(tripId, day, nextDay, place)}
      />

      <DaySegments tripId={tripId} dayId={day.id} dayDate={day.date} memberUids={memberUids} />
    </li>
  )
}
