import { LngLatBounds, Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import { osmRasterStyle } from '../../../shared/map/osmRasterStyle'
import { setLineLayer } from '../../../shared/map/setLineLayer'
import type { LatLng, Place } from '../../../shared/types/place'
import styles from './TripMap.module.css'

const ROUTE_SOURCE_ID = 'trip-route'
const TRACK_SOURCE_ID = 'trip-track'
const TRACK_COLOR = '#22c55e'

export type PhotoMarker = { id: string; lat: number; lng: number }

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

  const hasContent =
    destinations.length > 0 ||
    photoMarkers.length > 0 ||
    trackLines.length > 0 ||
    checkInMarkers.length > 0

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

      const allPoints = [
        ...destinations.map((d) => ({ lat: d.lat, lng: d.lng })),
        ...photoMarkers.map((p) => ({ lat: p.lat, lng: p.lng })),
        ...trackLines.flat(),
        ...checkInMarkers,
      ]

      if (allPoints.length > 1) {
        const [first, ...rest] = allPoints
        const bounds = rest.reduce(
          (b, point) => b.extend([point.lng, point.lat]),
          new LngLatBounds([first.lng, first.lat], [first.lng, first.lat]),
        )
        map.fitBounds(bounds, { padding: 60, maxZoom: 13 })
      } else if (allPoints.length === 1) {
        map.flyTo({ center: [allPoints[0].lng, allPoints[0].lat], zoom: 5 })
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
  }, [
    destinations,
    onSelectDestination,
    photoMarkers,
    onSelectPhotoMarker,
    trackLines,
    checkInMarkers,
  ])

  if (!hasContent) {
    return <p className={styles.empty}>Tilføj destinationer for at se dem på kortet.</p>
  }

  return <div ref={containerRef} className={styles.map} />
}
