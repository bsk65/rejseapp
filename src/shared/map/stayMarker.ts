import { Marker } from 'maplibre-gl'
import type { LatLng } from '../types/place'
import styles from './stayMarker.module.css'

/** Seng-nål for en overnatning. `title` vises som tooltip (navnet). */
export function createStayMarker(position: LatLng, title: string): Marker {
  const element = document.createElement('div')
  element.className = styles.marker
  element.textContent = '🛏'
  element.title = title
  return new Marker({ element }).setLngLat([position.lng, position.lat])
}
