import { useMemo, useRef, useState } from 'react'
import type { LatLng, Place } from '../../../shared/types/place'
import { resolveDayColor } from '../../../shared/utils/dayColors'
import { placeLabel } from '../../../shared/utils/placeLabel'
import type { Day } from '../../days/types'
import type { Photo } from '../../photos/types'
import { TrackingPanel } from '../../tracking/components/TrackingPanel'
import { useTrack } from '../../tracking/hooks/useTrack'
import { groupTrackLines } from '../../tracking/logic/groupTrackLines'
import { isRouteSource } from '../../tracking/types'
import type { Trip } from '../types'
import { TripMap, type MapFocus } from './TripMap'
import styles from './TripDetailPage.module.css'

/** Fanen "Kort & spor": kort, destinationsliste og sporing. */
export function TripMapTab({
  trip,
  userUid,
  days,
  photos,
  onShowDay,
}: {
  trip: Trip
  userUid: string
  days: Day[]
  photos: Photo[]
  onShowDay: (dayId: string) => void
}) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const { points: trackPoints, error: trackError } = useTrack(trip.id, userUid)
  const trackLines = useMemo(
    () => groupTrackLines(trackPoints.filter((p) => isRouteSource(p.source))),
    [trackPoints],
  )
  const checkInMarkers = useMemo(
    () => trackPoints.filter((p) => p.source === 'manuel'),
    [trackPoints],
  )
  const [focus, setFocus] = useState<MapFocus>({ kind: 'all' })
  const mapAnchorRef = useRef<HTMLDivElement>(null)
  const selectedImportId = focus.kind === 'selected' ? focus.key : null

  /** Viser ét importeret spor på kortet (fremhævet) og scroller op til kortet. */
  function showImport(importId: string) {
    const points = trackPoints
      .filter((p) => p.importId === importId)
      .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
    if (points.length === 0) return
    setFocus({
      kind: 'selected',
      key: importId,
      label: points[0].label ?? 'Importeret spor',
      points: points.map(({ lat, lng }) => ({ lat, lng })),
    })
    mapAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Billeder farves som den dag, de hører til — samme farve som dagen i listen.
  const photoMarkers = photos
    .filter((p): p is typeof p & { location: LatLng } => Boolean(p.location))
    .map((p) => {
      const day = days.find((d) => d.id === p.dayId)
      return {
        id: p.id,
        lat: p.location.lat,
        lng: p.location.lng,
        color: day ? resolveDayColor(day.dayNumber) : undefined,
      }
    })

  function handleSelectDestination(place: Place) {
    const matchingDay = days.find(
      (day) => day.fromPlace?.placeId === place.placeId || day.toPlace?.placeId === place.placeId,
    )
    if (matchingDay) {
      onShowDay(matchingDay.id)
    } else {
      // Ingen dag har fået tildelt denne destination endnu — fremhæv den i
      // stedet i destinationslisten herunder.
      setSelectedPlaceId(place.placeId)
    }
  }

  function handleSelectPhotoMarker(photoId: string) {
    const dayId = photos.find((p) => p.id === photoId)?.dayId
    if (dayId) onShowDay(dayId)
  }

  return (
    <>
      <div ref={mapAnchorRef} className={styles.mapAnchor}>
        <TripMap
          destinations={trip.destinations}
          onSelectDestination={handleSelectDestination}
          photoMarkers={photoMarkers}
          onSelectPhotoMarker={handleSelectPhotoMarker}
          trackLines={trackLines}
          checkInMarkers={checkInMarkers}
          focus={focus}
          onFocusChange={setFocus}
        />
      </div>

      {trip.destinations.length > 0 && (
        <ul className={styles.destinations}>
          {trip.destinations.map((place, index) => (
            <li
              key={place.placeId}
              className={styles.destinationItem}
              data-selected={place.placeId === selectedPlaceId}
            >
              <span className={styles.destinationIndex}>{index + 1}</span>
              <span>{placeLabel(place)}</span>
            </li>
          ))}
        </ul>
      )}

      <TrackingPanel
        context={{
          tripId: trip.id,
          userUid,
          tripOwnerUid: trip.ownerUid,
          memberUids: trip.memberUids,
          shareTrack: trip.sharedCategories.track,
        }}
        points={trackPoints}
        loadError={trackError}
        selectedImportId={selectedImportId}
        onSelectImport={showImport}
      />
    </>
  )
}
