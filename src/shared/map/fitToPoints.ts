import { LngLatBounds, type Map as MapLibreMap } from 'maplibre-gl'
import type { LatLng } from '../types/place'

/** Zoomer kortet så alle punkter er synlige. Ét punkt centreres på `singleZoom`. */
export function fitToPoints(
  map: MapLibreMap,
  points: LatLng[],
  { maxZoom, singleZoom }: { maxZoom: number; singleZoom: number },
): void {
  if (points.length === 0) return
  const [first, ...rest] = points
  if (rest.length === 0) {
    map.flyTo({ center: [first.lng, first.lat], zoom: singleZoom })
    return
  }
  const bounds = rest.reduce(
    (b, point) => b.extend([point.lng, point.lat]),
    new LngLatBounds([first.lng, first.lat], [first.lng, first.lat]),
  )
  map.fitBounds(bounds, { padding: 60, maxZoom })
}
