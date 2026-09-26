import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import { fitToPoints } from '../../../shared/map/fitToPoints'
import { osmRasterStyle } from '../../../shared/map/osmRasterStyle'
import { setCircleLayer } from '../../../shared/map/setCircleLayer'
import { setLineLayer } from '../../../shared/map/setLineLayer'
import type { LatLng, Place } from '../../../shared/types/place'
import styles from './TripMap.module.css'

const ROUTE_SOURCE_ID = 'trip-route'
const TRACK_SOURCE_ID = 'trip-track'
const TRACK_POINTS_SOURCE_ID = 'trip-track-points'
const TRACK_COLOR = '#22c55e'

export type PhotoMarker = { id: string; lat: number; lng: number }

type Focus = 'all' | 'track'

export function TripMap({
  destinations,
  onSelectDestination,
  photoMarkers = [],
  onSelectPhotoMarker,
  trackLines = [],
  checkInMarkers = [],
}: {
  destinations: Place[]
  onSelectDestination?: (place: Place) => void
  photoMarkers?: PhotoMarker[]
  onSelectPhotoMarker?: (photoId: string) => void
  /** Én linje pr. person, der er blevet GPS-sporet. */
  trackLines?: LatLng[][]
  checkInMarkers?: LatLng[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [focus, setFocus] = useState<Focus>('all')
  // Hvad kortet sidst blev zoomet til — så en genrendering med samme indhold
  // ikke nulstiller brugerens egen zoom/panorering.
  const lastFitKeyRef = useRef('')

  const trackPoints = [...trackLines.flat(), ...checkInMarkers]
  const hasTrack = trackPoints.length > 0
  const hasContent = destinations.length > 0 || photoMarkers.length > 0 || hasTrack

  // Kortet oprettes først når der er noget at vise (før det findes der ingen
  // container) — derfor afhænger effekten af hasContent og ikke bare [].
  useEffect(() => {
    if (!hasContent || !containerRef.current) return
    const map = new MapLibreMap({
      container: containerRef.current,
      style: osmRasterStyle,
      center: [10, 50],
      zoom: 2,
    })
    map.on('load', () => map.setProjection({ type: 'globe' }))
    mapRef.current = map
    lastFitKeyRef.current = ''

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [hasContent])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markers: Marker[] = []

    function render(map: MapLibreMap) {
      markers.forEach((marker) => marker.remove())
      markers.length = 0

      destinations.forEach((place) => {
        const marker = new Marker({ color: '#38bdf8' }).setLngLat([place.lng, place.lat]).addTo(map)
        marker.getElement().addEventListener('click', () => onSelectDestination?.(place))
        markers.push(marker)
      })

      photoMarkers.forEach((photo) => {
        const marker = new Marker({ color: '#f59e0b' }).setLngLat([photo.lng, photo.lat]).addTo(map)
        marker.getElement().addEventListener('click', () => onSelectPhotoMarker?.(photo.id))
        markers.push(marker)
      })

      checkInMarkers.forEach((point) => {
        markers.push(
          new Marker({ color: TRACK_COLOR, scale: 0.7 })
            .setLngLat([point.lng, point.lat])
            .addTo(map),
        )
      })

      setLineLayer(map, ROUTE_SOURCE_ID, [destinations], {
        'line-color': '#38bdf8',
        'line-width': 2,
        'line-dasharray': [2, 2],
      })
      setLineLayer(map, TRACK_SOURCE_ID, trackLines, {
        'line-color': TRACK_COLOR,
        'line-width': 3,
      })
      setCircleLayer(map, TRACK_POINTS_SOURCE_ID, trackLines.flat(), {
        'circle-color': TRACK_COLOR,
        'circle-radius': 5,
        'circle-stroke-color': '#0f172a',
        'circle-stroke-width': 1.5,
      })

      const fitPoints =
        focus === 'track' && trackPoints.length > 0
          ? trackPoints
          : [...destinations, ...photoMarkers, ...trackPoints]
      const fitKey = `${focus}:${JSON.stringify(fitPoints.map((p) => [p.lat, p.lng]))}`
      if (fitKey !== lastFitKeyRef.current) {
        lastFitKeyRef.current = fitKey
        fitToPoints(map, fitPoints, {
          maxZoom: focus === 'track' ? 16 : 13,
          singleZoom: focus === 'track' ? 15 : 5,
        })
      }
    }

    if (map.isStyleLoaded()) {
      render(map)
    } else {
      map.once('load', () => render(map))
    }

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  })

  if (!hasContent) {
    return <p className={styles.empty}>Tilføj destinationer for at se dem på kortet.</p>
  }

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />
      {hasTrack && (
        <button
          type="button"
          className={styles.focusButton}
          onClick={() => setFocus((f) => (f === 'track' ? 'all' : 'track'))}
        >
          {focus === 'track' ? 'Vis hele rejsen' : 'Vis sporet'}
        </button>
      )}
    </div>
  )
}
