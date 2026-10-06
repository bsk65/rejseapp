import { useT } from '../../../shared/i18n/useT'
import type { Place } from '../../../shared/types/place'
import { TransportModeIcon } from '../../segments/components/TransportModeIcon'
import { reservationKindIcon, type Reservation } from '../../reservations/types'
import type { Segment } from '../../segments/types'
import { BedIcon } from '../../stays/components/BedIcon'
import type { DayStayEvent } from '../../stays/logic/stayDates'
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
}: {
  from: Place | undefined
  to: Place | undefined
  segments: Segment[]
  stayEvents: DayStayEvent[]
  /** Dagens reservationer, allerede sorteret. */
  reservations: Reservation[]
  photoCount: number
}) {
  const { t } = useT()
  const route = routeLabel(from, to)
  // Natten til næste dag er den, der er relevant at se — ikke udtjekningen.
  const sleep = stayEvents.find((event) => event.kind !== 'udtjek')
  const hasDetails = segments.length > 0 || reservations.length > 0 || sleep || photoCount > 0

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
          {sleep && (
            <span className={styles.chip}>
              <BedIcon />
              <span className={styles.stayName}>{sleep.stay.name}</span>
            </span>
          )}
          {photoCount > 0 && <span className={styles.chip}>📷 {photoCount}</span>}
        </span>
      )}
    </div>
  )
}
