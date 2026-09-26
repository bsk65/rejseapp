import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthUser } from '../../auth/hooks/useAuthUser'
import { DaysList } from '../../days/components/DaysList'
import { useDays } from '../../days/hooks/useDays'
import { PhotoGallery } from '../../photos/components/PhotoGallery'
import { PhotoUploadButton } from '../../photos/components/PhotoUploadButton'
import { usePhotos } from '../../photos/hooks/usePhotos'
import { formatDateRange } from '../logic/tripDates'
import { useTrip } from '../hooks/useTrip'
import { ShareTripDialog } from './ShareTripDialog'
import { TripMap } from './TripMap'
import styles from './TripDetailPage.module.css'
import type { LatLng, Place } from '../../../shared/types/place'

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const { user } = useAuthUser()
  const { trip, loading } = useTrip(tripId)
  const { days, loading: daysLoading } = useDays(tripId, user?.uid)
  const { photos } = usePhotos(tripId, user?.uid)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [highlightedDayId, setHighlightedDayId] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  function scrollToDay(dayId: string) {
    setHighlightedDayId(dayId)
    document.getElementById(`dag-${dayId}`)?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleSelectDestination(place: Place) {
    const matchingDay = days.find(
      (day) => day.fromPlace?.placeId === place.placeId || day.toPlace?.placeId === place.placeId,
    )

    if (matchingDay) {
      scrollToDay(matchingDay.id)
    } else {
      // Ingen dag har fået tildelt denne destination endnu — fremhæv den i
      // stedet i destinationslisten herunder.
      setSelectedPlaceId(place.placeId)
    }
  }

  function handleSelectPhotoMarker(photoId: string) {
    const dayId = photos.find((p) => p.id === photoId)?.dayId
    if (dayId) scrollToDay(dayId)
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
  const unsortedPhotos = photos.filter((p) => !p.dayId)
  const photoMarkers = photos
    .filter((p): p is typeof p & { location: LatLng } => Boolean(p.location))
    .map((p) => ({ id: p.id, lat: p.location.lat, lng: p.location.lng }))

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
          sharedCategories={trip.sharedCategories}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      <TripMap
        destinations={trip.destinations}
        onSelectDestination={handleSelectDestination}
        photoMarkers={photoMarkers}
        onSelectPhotoMarker={handleSelectPhotoMarker}
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

      <PhotoUploadButton
        tripId={trip.id}
        uploaderUid={user.uid}
        tripOwnerUid={trip.ownerUid}
        memberUids={trip.memberUids}
        sharePhotos={trip.sharedCategories.photos}
        days={days}
      />
      {unsortedPhotos.length > 0 && (
        <div>
          <p className={styles.sectionLabel}>Billeder uden dag</p>
          <PhotoGallery tripId={trip.id} photos={unsortedPhotos} />
        </div>
      )}

      <DaysList
        tripId={trip.id}
        memberUids={trip.memberUids}
        days={days}
        photos={photos}
        loading={daysLoading}
        highlightedDayId={highlightedDayId}
      />
    </div>
  )
}
