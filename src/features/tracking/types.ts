import type { LatLng } from '../../shared/types/place'

/** Hvor et sporingspunkt kommer fra. 'foto' er reserveret til opsummeringen (trin 8). */
export type TrackSource = 'gps' | 'foto' | 'manuel'

export type TrackPoint = LatLng & {
  id: string
  /** ISO-tidspunkt for hvornår man var på stedet. */
  timestamp: string
  source: TrackSource
  /** Stednavn ved manuelt check-in via stedsøgning. */
  label?: string
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
