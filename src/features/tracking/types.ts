import type { LatLng } from '../../shared/types/place'

/**
 * Hvor et sporingspunkt kommer fra: 'gps' = telefonens egen sporing,
 * 'import' = GPX-fil (ur/Strava), 'manuel' = check-in. 'foto' bruges ikke —
 * opsummeringen (trin 8) læser billeder direkte fra photos-samlingen.
 */
export type TrackSource = 'gps' | 'import' | 'foto' | 'manuel'

/** Kilder der danner en rute (linje) på kortet — modsat enkeltstående check-ins. */
export function isRouteSource(source: TrackSource): boolean {
  return source === 'gps' || source === 'import'
}

export type TrackPoint = LatLng & {
  id: string
  /** ISO-tidspunkt for hvornår man var på stedet. */
  timestamp: string
  source: TrackSource
  /** Stednavn ved check-in, eller sporets navn/filnavn ved import. */
  label?: string
  /** Fælles id for alle punkter fra samme GPX-import — så sporet kan slettes samlet. */
  importId?: string
  /** Hvem der blev sporet / checkede ind. */
  ownerUid: string
  /** Hvem der må se punktet lige nu — styres af trippens sharedCategories.track. Se CLAUDE.md. */
  trackViewerUids: string[]
}

export type NewTrackPoint = Omit<TrackPoint, 'id'>

/** Det en komponent skal vide om rejsen og brugeren for at kunne gemme punkter. */
export type TrackingContext = {
  tripId: string
  userUid: string
  tripOwnerUid: string
  memberUids: string[]
  shareTrack: boolean
}
