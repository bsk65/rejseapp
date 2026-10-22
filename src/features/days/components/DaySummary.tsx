import { useT } from '../../../shared/i18n/useT'
import type { Place } from '../../../shared/types/place'
import { TransportModeIcon } from '../../segments/components/TransportModeIcon'
import { reservationKindIcon, type Reservation } from '../../reservations/types'
import type { Segment } from '../../segments/types'
import { BedIcon } from '../../stays/components/BedIcon'
import { dayStayChange, type DayStayEvent } from '../../stays/logic/stayDates'
import { clockTime } from '../../../shared/utils/date'
import { routeLabel } from '../logic/daySummary'
import styles from './DaySummary.module.css'

/** Den korte udgave af en dag, når den er foldet sammen: rute, transport, overnatning, billeder. */
export function DaySummary({
  from,
  to,
  segments,
  stayEvents,
  reservations,
  photoCount,
  isLastDay,
}: {
  from: Place | undefined
  to: Place | undefined
  segments: Segment[]
  stayEvents: DayStayEvent[]
  /** Dagens reservationer, allerede sorteret. */
  reservations: Reservation[]
  photoCount: number
  /** Rejsens sidste dag: man tjekker ud og tager hjem, så der mangler ingen overnatning. */
  isLastDay: boolean
}) {
  const { t } = useT()
  const route = routeLabel(from, to)
  // Stedet man tjekker ud af → stedet man sover i aften. Pilen uden noget efter
  // betyder, at aftenens overnatning mangler.
  const { leaving, tonight } = dayStayChange(stayEvents)
  const missingTonight = !!leaving && !tonight && !isLastDay
  const hasDetails =
    segments.length > 0 || reservations.length > 0 || leaving || tonight || photoCount > 0

  return (
    <div className={styles.summary}>
      <span className={route ? styles.route : styles.empty}>
        {route ?? t('days.nothingPlanned')}
      </span>
      {hasDetails && (
        <span className={styles.chips}>
          {segments.map((segment) => (
            <span key={segment.id} className={styles.chip}>
              <TransportModeIcon mode={segment.mode} />
              {clockTime(segment.departureTime)}
            </span>
          ))}
          {reservations.map((reservation) => (
            <span key={reservation.id} className={styles.chip}>
              <span aria-hidden="true">{reservationKindIcon[reservation.kind]}</span>
              {reservation.time}
            </span>
          ))}
          {(leaving || tonight) && (
            <span className={styles.chip} data-missing={missingTonight}>
              <BedIcon />
              {leaving && <span className={styles.leavingName}>{leaving.name}</span>}
              {leaving && (tonight || !isLastDay) && (
                <span
                  className={styles.arrow}
                  role="img"
                  aria-label={missingTonight ? t('days.noStayTonight') : t('days.movesTo')}
                  title={missingTonight ? t('days.noStayTonight') : undefined}
                >
                  →
                </span>
              )}
              {tonight && <span className={styles.stayName}>{tonight.name}</span>}
            </span>
          )}
          {photoCount > 0 && <span className={styles.chip}>📷 {photoCount}</span>}
        </span>
      )}
    </div>
  )
}
