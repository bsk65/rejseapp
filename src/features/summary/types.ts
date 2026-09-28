import type { LatLng } from '../../shared/types/place'

/**
 * Hvad et stop i afspilningen stammer fra: 'spor' = GPS/GPX-punkt,
 * 'checkin' = manuelt check-in, 'foto' = billede med position,
 * 'sted' = dagens planlagte Fra/Til (bruges kun for dage uden andet).
 */
export type StopKind = 'spor' | 'checkin' | 'foto' | 'sted'

export type JourneyStop = LatLng & {
  /** Tidspunkt i ms (Date.getTime). */
  time: number
  kind: StopKind
  dayNumber?: number
  /** Stednavn (check-in / planlagt sted). */
  label?: string
  photoId?: string
  storagePath?: string
}
