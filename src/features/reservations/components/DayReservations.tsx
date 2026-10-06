import { useState } from 'react'
import { useT } from '../../../shared/i18n/useT'
import { reservationsForDate } from '../logic/reservationDates'
import { reservationKindIcon, type Reservation } from '../types'
import { ReservationForm } from './ReservationForm'
import styles from './DayReservations.module.css'

/** Dagens reservationer (restaurant, aktivitet …) og knappen til at tilføje en ny. */
export function DayReservations({
  tripId,
  userUid,
  memberUids,
  date,
  reservations,
}: {
  tripId: string
  userUid: string
  memberUids: string[]
  date: string
  reservations: Reservation[]
}) {
  const { t } = useT()
  const [editing, setEditing] = useState<Reservation | 'ny' | null>(null)
  const today = reservationsForDate(reservations, date)

  return (
    <div className={styles.wrapper}>
      {today.length > 0 && (
        <ul className={styles.list}>
          {today.map((reservation) => (
            <li key={reservation.id}>
              <button type="button" className={styles.item} onClick={() => setEditing(reservation)}>
                <span className={styles.icon} aria-hidden="true">
                  {reservationKindIcon[reservation.kind]}
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>{reservation.name}</span>
                  <span className={styles.detail}>
                    {[reservation.time ?? t('reservations.noTime'), reservation.place?.area]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <ReservationForm
          key={editing === 'ny' ? 'ny' : editing.id}
          tripId={tripId}
          userUid={userUid}
          memberUids={memberUids}
          reservation={editing === 'ny' ? undefined : editing}
          initialDate={date}
          onClose={() => setEditing(null)}
        />
      ) : (
        <button type="button" className={styles.addButton} onClick={() => setEditing('ny')}>
          <span aria-hidden="true">🍽️</span>
          {t('reservations.addReservation')}
        </button>
      )}
    </div>
  )
}
