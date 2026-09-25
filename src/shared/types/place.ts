export type LatLng = {
  lat: number
  lng: number
}

export type Place = LatLng & {
  name: string
  placeId: string
}
