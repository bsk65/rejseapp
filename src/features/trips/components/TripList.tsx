import type { Trip } from '../types'
import { TripListItem } from './TripListItem'
import styles from './TripList.module.css'

export function TripList({
  trips,
  loading,
  emptyText,
}: {
  trips: Trip[]
  loading: boolean
  emptyText: string
}) {
  if (loading) {
    return <p className={styles.empty}>Henter dine rejser…</p>
  }

  if (trips.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>
  }

  return (
    <ul className={styles.list}>
      {trips.map((trip) => (
        <TripListItem key={trip.id} trip={trip} />
      ))}
    </ul>
  )
}
