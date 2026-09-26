import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { DaysList } from '../../days/components/DaysList'
import { useDays } from '../../days/hooks/useDays'
import { formatDateRange } from '../logic/tripDates'
import { useTrip } from '../hooks/useTrip'
import { ShareTripDialog } from './ShareTripDialog'
import { TripMap } from './TripMap'
import styles from './TripDetailPage.module.css'
import type { Place } from '../../../shared/types/place'

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuthUser()
  const { trip, loading } = useTrip(tripId)
  const { days, loading: daysLoading } = useDays(tripId, user?.uid)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [highlightedDayId, setHighlightedDayId] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  function handleSelectDestination(place: Place) {
    const matchingDay = days.find(
      (day) => day.fromPlace?.placeId === place.placeId || day.toPlace?.placeId === place.placeId,
    )

    if (matchingDay) {
      setHighlightedDayId(matchingDay.id)
      document.getElementById(`dag-${matchingDay.id}`)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Ingen dag har fået tildelt denne destination endnu — fremhæv den i
      // stedet i destinationslisten herunder.
      setSelectedPlaceId(place.placeId)
    }
  }

  if (loading) {
    return <p className={styles.status}>Henter rejsen…</p>
  }

  if (!trip || !user) {
    return (
      <div className={styles.page}>
        <p className={styles.status}>Rejsen findes ikke, eller du har ikke adgang til den.</p>
        <Link to="/">Tilbage til mine rejser</Link>
      </div>
    )
  }

  const isOwner = user.uid === trip.ownerUid

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back}>
        ← Mine rejser
      </Link>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{trip.title}</h1>
          <p className={styles.meta}>{formatDateRange(trip.startDate, trip.days)}</p>
        </div>
        {isOwner && (
          <button
            type="button"
            className={styles.shareButton}
            onClick={() => setShowShareDialog(true)}
          >
            Del rejse
          </button>
        )}
      </div>

      {showShareDialog && (
        <ShareTripDialog
          tripId={trip.id}
          ownerUid={trip.ownerUid}
          memberUids={trip.memberUids}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      <TripMap destinations={trip.destinations} onSelectDestination={handleSelectDestination} />

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

      <DaysList
        tripId={trip.id}
        memberUids={trip.memberUids}
        days={days}
        loading={daysLoading}
        highlightedDayId={highlightedDayId}
      />
    </div>
  )
}
