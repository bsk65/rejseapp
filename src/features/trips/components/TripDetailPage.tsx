import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDateRange } from '../logic/tripDates'
import { useTrip } from '../hooks/useTrip'
import { TripMap } from './TripMap'
import styles from './TripDetailPage.module.css'

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { trip, loading } = useTrip(tripId)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)

  if (loading) {
    return <p className={styles.status}>Henter rejsen…</p>
  }

  if (!trip) {
    return (
      <div className={styles.page}>
        <p className={styles.status}>Rejsen findes ikke, eller du har ikke adgang til den.</p>
        <Link to="/">Tilbage til mine rejser</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Mine rejser
      </Link>
      <h1 className={styles.title}>{trip.title}</h1>
      <p className={styles.meta}>{formatDateRange(trip.startDate, trip.days)}</p>

      {/* Klik fremhæver destinationen herunder indtil trin 3 (dage), hvor det
          i stedet skal hoppe til den dag destinationen hører til. */}
      <TripMap
        destinations={trip.destinations}
        onSelectDestination={(place) => setSelectedPlaceId(place.placeId)}
      />

      {trip.destinations.length > 0 && (
        <ul className={styles.destinations}>
          {trip.destinations.map((place, index) => (
            <li
              key={place.placeId}
              className={styles.destinationItem}
              data-selected={place.placeId === selectedPlaceId}
            >
              <span className={styles.destinationIndex}>{index + 1}</span>
              <span>{place.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
