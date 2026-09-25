import type { Trip } from '../types'
import { TripListItem } from './TripListItem'
import styles from './TripList.module.css'

export function TripList({ trips, loading }: { trips: Trip[]; loading: boolean }) {
  if (loading) {
    return <p className={styles.empty}>Henter dine rejser…</p>
  }

  if (trips.length === 0) {
    return <p className={styles.empty}>Du har ikke oprettet nogen rejser endnu.</p>
  }

  return (
    <ul className={styles.list}>
      {trips.map((trip) => (
        <TripListItem key={trip.id} trip={trip} />
      ))}
    </ul>
  )
}
