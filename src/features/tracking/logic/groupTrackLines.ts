import type { LatLng } from '../../../shared/types/place'
import type { TrackPoint } from '../types'

/**
 * Deler sporingspunkter op i én linje pr. person (ownerUid) og pr. importeret
 * spor, sorteret efter tid — ellers ville kortet tegne streger på kryds og
 * tværs mellem rejsefæller, der er forskellige steder, og mellem to separate
 * ture.
 */
export function groupTrackLines(points: TrackPoint[]): LatLng[][] {
  const byOwner = new Map<string, TrackPoint[]>()
  points.forEach((point) => {
    const key = `${point.ownerUid}:${point.importId ?? 'live'}`
    const list = byOwner.get(key) ?? []
    list.push(point)
    byOwner.set(key, list)
  })

  return Array.from(byOwner.values()).map((list) =>
    [...list]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(({ lat, lng }) => ({ lat, lng })),
  )
}
