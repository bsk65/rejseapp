export type LatLng = {
  lat: number
  lng: number
}

export type Place = LatLng & {
  name: string
  placeId: string
  /** By og land, f.eks. "Málaga, Spanien" — mangler på ældre steder og lufthavne. */
  area?: string
}
