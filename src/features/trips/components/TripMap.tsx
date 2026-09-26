import { GeoJSONSource, LngLatBounds, Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import { osmRasterStyle } from '../../../shared/map/osmRasterStyle'
import type { Place } from '../../../shared/types/place'
import styles from './TripMap.module.css'

const ROUTE_SOURCE_ID = 'trip-route'

export type PhotoMarker = { id: string; lat: number; lng: number }

export function TripMap({
  destinations,
  onSelectDestination,
  photoMarkers = [],
  onSelectPhotoMarker,
}: {
  destinations: Place[]
  onSelectDestination?: (place: Place) => void
  photoMarkers?: PhotoMarker[]
  onSelectPhotoMarker?: (photoId: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
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
  }, [])

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

      const allPoints = [
        ...destinations.map((d) => ({ lat: d.lat, lng: d.lng })),
        ...photoMarkers.map((p) => ({ lat: p.lat, lng: p.lng })),
      ]

      const existingSource = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined

      if (destinations.length > 1) {
        const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: destinations.map((place) => [place.lng, place.lat]),
          },
        }
        if (existingSource) {
          existingSource.setData(geojson)
        } else {
          map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson })
          map.addLayer({
            id: ROUTE_SOURCE_ID,
            type: 'line',
            source: ROUTE_SOURCE_ID,
            paint: { 'line-color': '#38bdf8', 'line-width': 2, 'line-dasharray': [2, 2] },
          })
        }
      } else if (existingSource) {
        map.removeLayer(ROUTE_SOURCE_ID)
        map.removeSource(ROUTE_SOURCE_ID)
      }

      if (allPoints.length > 1) {
        const [first, ...rest] = allPoints
        const bounds = rest.reduce(
          (b, point) => b.extend([point.lng, point.lat]),
          new LngLatBounds([first.lng, first.lat], [first.lng, first.lat]),
        )
        map.fitBounds(bounds, { padding: 60, maxZoom: 8 })
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
  }, [destinations, onSelectDestination, photoMarkers, onSelectPhotoMarker])

  if (destinations.length === 0 && photoMarkers.length === 0) {
    return <p className={styles.empty}>Tilføj destinationer for at se dem på kortet.</p>
  }

  return <div ref={containerRef} className={styles.map} />
}
