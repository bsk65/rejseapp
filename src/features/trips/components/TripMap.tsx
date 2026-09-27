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
const HIGHLIGHT_SOURCE_ID = 'trip-track-highlight'
const HIGHLIGHT_COLOR = '#facc15'
const TRACK_COLOR = '#22c55e'
const PHOTO_COLOR = '#f59e0b'

/** color: dagens farve, hvis billedet hører til en dag (ellers standard-orange). */
export type PhotoMarker = { id: string; lat: number; lng: number; color?: string }

type FitRequest = { key: string; points: LatLng[]; maxZoom: number; singleZoom: number }

/** Udfører den ventende zoom, hvis den er ny og kortet har en synlig størrelse. */
function applyPendingFit(
  map: MapLibreMap,
  container: HTMLElement | null,
  request: FitRequest | null,
  lastFitKey: { current: string },
): void {
  if (!request || request.key === lastFitKey.current) return
  if (!container || container.clientWidth === 0) return
  lastFitKey.current = request.key
  fitToPoints(map, request.points, request)
}

/**
 * Hvad kortet er zoomet ind på: hele rejsen, alle spor, eller ét valgt spor
 * (fremhævet med gult). Styres af forælderen, så f.eks. listen over
 * importerede spor kan vælge et spor.
 */
export type MapFocus =
  | { kind: 'all' }
  | { kind: 'tracks' }
  | { kind: 'selected'; key: string; label: string; points: LatLng[] }

export function TripMap({
  destinations,
  onSelectDestination,
  photoMarkers = [],
  onSelectPhotoMarker,
  trackLines = [],
  checkInMarkers = [],
  focus,
  onFocusChange,
}: {
  destinations: Place[]
  onSelectDestination?: (place: Place) => void
  photoMarkers?: PhotoMarker[]
  onSelectPhotoMarker?: (photoId: string) => void
  /** Én linje pr. person, der er blevet GPS-sporet. */
  trackLines?: LatLng[][]
  checkInMarkers?: LatLng[]
  focus: MapFocus
  onFocusChange: (focus: MapFocus) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  // Hvad kortet sidst blev zoomet til — så en genrendering med samme indhold
  // ikke nulstiller brugerens egen zoom/panorering.
  const lastFitKeyRef = useRef('')
  // Den seneste ønskede zoom — udføres først, når kortet har en synlig
  // størrelse (det ligger på en fane, der kan være skjult).
  const pendingFitRef = useRef<FitRequest | null>(null)

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
    map.on('load', () => {
      map.setProjection({ type: 'globe' })
      setMapReady(true)
    })
    mapRef.current = map
    lastFitKeyRef.current = ''

    // Når fanen vises igen, har containeren fået en størrelse: tilpas kortet
    // og udfør en zoom, der ikke kunne laves, mens det var skjult.
    const container = containerRef.current
    const observer = new ResizeObserver(() => {
      if (container.clientWidth === 0) return
      map.resize()
      applyPendingFit(map, containerRef.current, pendingFitRef.current, lastFitKeyRef)
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [hasContent])

  // Tegner først når kortets 'load' er sket én gang (mapReady). Brug IKKE
  // map.isStyleLoaded() her: den er false mens kortfliser hentes (f.eks.
  // under en zoom), og en efterfølgende once('load') fyrer aldrig igen — så
  // nye punkter blev aldrig tegnet.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

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
        const marker = new Marker({ color: photo.color || PHOTO_COLOR })
          .setLngLat([photo.lng, photo.lat])
          .addTo(map)
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
      setLineLayer(map, HIGHLIGHT_SOURCE_ID, focus.kind === 'selected' ? [focus.points] : [], {
        'line-color': HIGHLIGHT_COLOR,
        'line-width': 5,
      })

      const zoomedIn = focus.kind !== 'all'
      const fitPoints =
        focus.kind === 'selected'
          ? focus.points
          : focus.kind === 'tracks' && trackPoints.length > 0
            ? trackPoints
            : [...destinations, ...photoMarkers, ...trackPoints]
      const focusKey = focus.kind === 'selected' ? focus.key : focus.kind
      const fitKey = `${focusKey}:${JSON.stringify(fitPoints.map((p) => [p.lat, p.lng]))}`
      pendingFitRef.current = {
        key: fitKey,
        points: fitPoints,
        maxZoom: zoomedIn ? 16 : 13,
        singleZoom: zoomedIn ? 15 : 5,
      }
      applyPendingFit(map, containerRef.current, pendingFitRef.current, lastFitKeyRef)
    }

    render(map)

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
        <div className={styles.overlay}>
          <button
            type="button"
            className={styles.focusButton}
            onClick={() =>
              onFocusChange(focus.kind === 'all' ? { kind: 'tracks' } : { kind: 'all' })
            }
          >
            {focus.kind === 'all' ? 'Vis alle spor' : 'Vis hele rejsen'}
          </button>
          {focus.kind === 'selected' && <span className={styles.focusLabel}>{focus.label}</span>}
        </div>
      )}
    </div>
  )
}
