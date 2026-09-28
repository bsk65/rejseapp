import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../../../shared/map/configureMapLibre'
import { useEffect, useRef, useState } from 'react'
import { fitToPoints } from '../../../shared/map/fitToPoints'
import { osmRasterStyle } from '../../../shared/map/osmRasterStyle'
import { setCircleLayer } from '../../../shared/map/setCircleLayer'
import { setLineLayer } from '../../../shared/map/setLineLayer'
import { dayColorIndex } from '../../../shared/utils/dayColors'
import type { JourneyPath } from '../logic/journeyPath'
import { traveledPoints } from '../logic/journeyPath'
import { zoomForLegKm, type PlaybackState } from '../logic/timeline'
import type { JourneyStop } from '../types'
import styles from './JourneyMap.module.css'

const FULL_ROUTE_ID = 'journey-full'
const TRAVELED_ID = 'journey-traveled'
const PHOTOS_ID = 'journey-photos'
const TRAVELED_COLOR = '#facc15'
/** Hvor hurtigt kameraets zoom glider mod målet pr. billede (0-1). */
const ZOOM_EASING = 0.06

/**
 * Kortet i afspilningen. `follow`: kameraet følger den aktuelle position og
 * zoomer efter strækkets længde. Ellers vises hele rejsen (før start og når
 * den er spillet færdig), og brugeren kan selv panorere.
 */
export function JourneyMap({
  stops,
  path,
  state,
  follow,
}: {
  stops: JourneyStop[]
  path: JourneyPath
  state: PlaybackState
  follow: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const zoomRef = useRef<number | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
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
    const element = document.createElement('div')
    element.className = styles.marker
    markerRef.current = new Marker({ element })
    mapRef.current = map

    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      markerRef.current?.remove()
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Hele ruten (svag) og billedernes placering — ændres kun med data.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    setLineLayer(map, FULL_ROUTE_ID, [path.points], {
      'line-color': '#f1f5f9',
      'line-opacity': 0.35,
      'line-width': 2,
      'line-dasharray': [2, 2],
    })
    setCircleLayer(
      map,
      PHOTOS_ID,
      stops.filter((stop) => stop.kind === 'foto'),
      {
        'circle-color': '#f59e0b',
        'circle-radius': 4,
        'circle-stroke-color': '#0f172a',
        'circle-stroke-width': 1,
      },
    )
  }, [mapReady, path, stops])

  // Oversigt: zoom ud til hele rejsen, når afspilningen ikke kører.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || follow) return
    zoomRef.current = null
    fitToPoints(map, stops, { maxZoom: 13, singleZoom: 12 })
  }, [mapReady, follow, stops])

  // Tilbagelagt rute, markør og kamera — opdateres for hvert billede.
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker || !mapReady) return

    setLineLayer(map, TRAVELED_ID, [traveledPoints(path, state)], {
      'line-color': TRAVELED_COLOR,
      'line-width': 4,
    })

    const dayNumber = stops[state.stopIndex]?.dayNumber
    marker.getElement().dataset.dayColor = dayNumber ? String(dayColorIndex(dayNumber)) : ''
    marker.setLngLat([state.position.lng, state.position.lat]).addTo(map)

    if (!follow) return
    const current = zoomRef.current ?? map.getZoom()
    const target = state.legKm > 0 ? zoomForLegKm(state.legKm) : current
    zoomRef.current = current + (target - current) * ZOOM_EASING
    map.jumpTo({ center: [state.position.lng, state.position.lat], zoom: zoomRef.current })
  }, [mapReady, path, state, stops, follow])

  return <div ref={containerRef} className={styles.map} />
}
