import { PlaceField } from '../../../shared/ui/PlaceField'
import { DaySegments } from '../../segments/components/DaySegments'
import { useDayPlace } from '../hooks/useDayPlace'
import type { Day } from '../types'
import styles from './DayRow.module.css'

export function DayRow({
  tripId,
  ownerUid,
  day,
  highlighted,
}: {
  tripId: string
  ownerUid: string
  day: Day
  highlighted: boolean
}) {
  const { setDayPlace } = useDayPlace()

  return (
    <li id={`dag-${day.id}`} className={styles.row} data-highlighted={highlighted}>
      <div className={styles.header}>
        <span className={styles.dayNumber}>Dag {day.dayNumber}</span>
        <span className={styles.date}>{day.date}</span>
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

      <DaySegments tripId={tripId} dayId={day.id} ownerUid={ownerUid} />
    </li>
  )
}
