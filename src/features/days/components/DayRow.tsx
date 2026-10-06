import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { PlaceField } from '../../../shared/ui/PlaceField'
import { formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import { PhotoGallery } from '../../photos/components/PhotoGallery'
import type { Photo } from '../../photos/types'
import { DaySegments } from '../../segments/components/DaySegments'
import { useSegments } from '../../segments/hooks/useSegments'
import { DayReservations } from '../../reservations/components/DayReservations'
import { reservationsForDate } from '../../reservations/logic/reservationDates'
import type { Reservation } from '../../reservations/types'
import { DayStays } from '../../stays/components/DayStays'
import { stayEventsForDate } from '../../stays/logic/stayDates'
import type { Stay } from '../../stays/types'
import { useDayPlace } from '../hooks/useDayPlace'
import { effectiveFromPlace } from '../logic/followPreviousDay'
import type { Day } from '../types'
import { DaySummary } from './DaySummary'
import { DeleteDayButton } from './DeleteDayButton'
import styles from './DayRow.module.css'

/**
 * Én dag i listen. Foldet sammen vises kun et kort resumé; et tryk på
 * overskriften folder den ud til alt indholdet (steder, billeder,
 * overnatning, transport).
 */
export function DayRow({
  tripId,
  memberUids,
  userUid,
  stays,
  reservations,
  day,
  previousDay,
  nextDay,
  photos,
  highlighted,
  expanded,
  isToday,
  onToggle,
  onDelete,
  deleteError,
}: {
  tripId: string
  memberUids: string[]
  userUid: string
  /** Alle rejsens overnatninger — dagen viser selv dem, der berører den. */
  stays: Stay[]
  /** Alle rejsens reservationer — dagen viser selv dem med dens dato. */
  reservations: Reservation[]
  day: Day
  /** Bruges til at foreslå "Fra" = dagen før's "Til". */
  previousDay: Day | undefined
  /** Får automatisk dagens "Til" som sit "Fra". */
  nextDay: Day | undefined
  photos: Photo[]
  highlighted: boolean
  expanded: boolean
  isToday: boolean
  onToggle: () => void
  /** Kun sat for rejsens første/sidste dag, og kun for ejeren. */
  onDelete?: () => Promise<boolean>
  deleteError: TextKey | null
}) {
  const { t, locale } = useT()
  const { setFromPlace, setToPlace, clearPlace } = useDayPlace()
  const { segments } = useSegments(tripId, day.id, userUid)
  const fromPlace = effectiveFromPlace(day, previousDay)
  const bodyId = `dag-${day.id}-indhold`

  return (
    <li
      id={`dag-${day.id}`}
      className={styles.row}
      data-highlighted={highlighted}
      data-expanded={expanded}
      data-day-color={dayColorIndex(day.dayNumber)}
    >
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
      >
        <span className={styles.titleLine}>
          <span className={styles.dayNumber}>{t('days.dayN', { n: day.dayNumber })}</span>
          <span className={styles.date}>{formatDayDate(day.date, locale)}</span>
          {isToday && <span className={styles.today}>{t('days.today')}</span>}
          <span className={styles.chevron} aria-hidden="true">
            ›
          </span>
        </span>
        {!expanded && (
          <DaySummary
            from={fromPlace}
            to={day.toPlace}
            segments={segments}
            stayEvents={stayEventsForDate(stays, day.date)}
            reservations={reservationsForDate(reservations, day.date)}
            photoCount={photos.length}
          />
        )}
      </button>

      {expanded && (
        <div id={bodyId} className={styles.body}>
          <div className={styles.places}>
            <PlaceField
              label={t('days.from')}
              place={fromPlace}
              onSelect={(place) => void setFromPlace(tripId, day, place)}
              // Kun dagens eget "Fra" kan fjernes — et lånt fra dagen før fjernes dér.
              onClear={day.fromPlace ? () => void clearPlace(tripId, day, 'fromPlace') : undefined}
              clearLabel={t('days.clearPlace', { label: t('days.from') })}
            />
            <PlaceField
              label={t('days.to')}
              place={day.toPlace}
              onSelect={(place) => void setToPlace(tripId, day, nextDay, place)}
              onClear={() => void clearPlace(tripId, day, 'toPlace')}
              clearLabel={t('days.clearPlace', { label: t('days.to') })}
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

          <DayReservations
            tripId={tripId}
            userUid={userUid}
            memberUids={memberUids}
            date={day.date}
            reservations={reservations}
          />

          <DaySegments
            tripId={tripId}
            dayId={day.id}
            dayDate={day.date}
            memberUids={memberUids}
            segments={segments}
          />

          {onDelete && (
            <DeleteDayButton
              day={day}
              segmentCount={segments.length}
              photoCount={photos.length}
              error={deleteError}
              onDelete={onDelete}
            />
          )}
        </div>
      )}
    </li>
  )
}
