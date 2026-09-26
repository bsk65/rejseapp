import { Link } from 'react-router-dom'
import { formatDateRange } from '../logic/tripDates'
import type { Trip } from '../types'
import styles from './TripListItem.module.css'

const statusLabel: Record<Trip['status'], string> = {
  planlagt: 'Planlagt',
  'i gang': 'I gang',
  afsluttet: 'Afsluttet',
}

export function TripListItem({ trip }: { trip: Trip }) {
  return (
    <li>
      <Link to={`/rejser/${trip.id}`} className={styles.item}>
        <div>
          <p className={styles.title}>{trip.title}</p>
          <p className={styles.meta}>{formatDateRange(trip.startDate, trip.days)}</p>
          {trip.destinations.length > 0 && (
            <p className={styles.meta}>{trip.destinations.map((d) => d.name).join(' → ')}</p>
          )}
        </div>
        <span className={styles.status} data-status={trip.status}>
          {statusLabel[trip.status]}
        </span>
      </Link>
    </li>
  )
}
