import { useT } from '../../../shared/i18n/useT'
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
  const { t } = useT()
  if (loading) {
    return <p className={styles.empty}>{t('trips.loadingTrips')}</p>
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
