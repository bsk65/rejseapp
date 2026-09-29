import { Link } from 'react-router-dom'
import type { TextKey } from '../../../shared/i18n/translator'
import { useT } from '../../../shared/i18n/useT'
import { formatDateRange } from '../logic/tripDates'
import type { Trip } from '../types'
import styles from './TripListItem.module.css'

const statusLabel: Record<Trip['status'], TextKey> = {
  planlagt: 'trips.statusPlanned',
  'i gang': 'trips.statusOngoing',
  afsluttet: 'trips.statusDone',
}

export function TripListItem({ trip }: { trip: Trip }) {
  const { t } = useT()
  return (
    <li>
      <Link to={`/rejser/${trip.id}`} className={styles.item}>
        <div>
          <p className={styles.title}>
            {trip.title}
            {trip.memberUids.length > 1 && <span className={styles.shared}>{t('trips.shared')}</span>}
          </p>
          <p className={styles.meta}>{formatDateRange(trip.startDate, trip.days)}</p>
          {trip.destinations.length > 0 && (
            <p className={styles.meta}>{trip.destinations.map((d) => d.name).join(' → ')}</p>
          )}
        </div>
        <span className={styles.status} data-status={trip.status}>
          {t(statusLabel[trip.status])}
        </span>
      </Link>
    </li>
  )
}
