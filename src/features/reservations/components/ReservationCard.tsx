import { useT } from '../../../shared/i18n/useT'
import { formatDayDate } from '../../../shared/utils/date'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import { reservationKindIcon, reservationKindLabel, type Reservation } from '../types'
import styles from './ReservationCard.module.css'

/** En reservation som kort i "Billetter & tider". */
export function ReservationCard({
  reservation,
  dayNumber,
  onSelect,
}: {
  reservation: Reservation
  /** Rejsedagen for datoen, hvis den ligger inden for rejsen. */
  dayNumber?: number
  onSelect: () => void
}) {
  const { t, locale } = useT()

  return (
    <button
      type="button"
      className={styles.card}
      data-day-color={dayNumber ? dayColorIndex(dayNumber) : undefined}
      onClick={onSelect}
    >
      <div className={styles.top}>
        <span className={styles.time}>{reservation.time ?? '--:--'}</span>
        <span className={styles.kind}>
          <span aria-hidden="true">{reservationKindIcon[reservation.kind]}</span>
          {t(reservationKindLabel[reservation.kind])}
        </span>
      </div>

      <p className={styles.name}>
        {reservation.name}
        {reservation.place?.area && (
          <span className={styles.muted}> · {reservation.place.area}</span>
        )}
      </p>

      <p className={styles.meta}>
        {dayNumber && <span className={styles.day}>{t('days.dayN', { n: dayNumber })} · </span>}
        {formatDayDate(reservation.date, locale)}
        {!reservation.time && ` · ${t('reservations.noTime')}`}
      </p>

      {(reservation.bookingRef || reservation.note) && (
        <div className={styles.bottom}>
          {reservation.bookingRef && (
            <span className={styles.booking}>{reservation.bookingRef}</span>
          )}
          {reservation.note && <span className={styles.muted}>{reservation.note}</span>}
        </div>
      )}
    </button>
  )
}
