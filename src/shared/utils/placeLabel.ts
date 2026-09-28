import type { Place } from '../types/place'

/** "Hjem · Málaga, Spanien", eller bare navnet hvis området ikke kendes. */
export function placeLabel(place: Place): string {
  return place.area ? `${place.name} · ${place.area}` : place.name
}
