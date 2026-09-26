import type { Place } from '../types/place'

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

/**
 * Nominatims display_name er hele adressehierarkiet (f.eks.
 * "Rom, Roma Capitale, Lazio, Italien") — for langt til lister og
 * kort-markører, så vi bruger kun det første, mest specifikke led.
 */
function shortenDisplayName(displayName: string): string {
  return displayName.split(',')[0]?.trim() || displayName
}

export function mapNominatimResults(results: NominatimResult[]): Place[] {
  return results.map((result) => ({
    name: shortenDisplayName(result.display_name),
    lat: Number(result.lat),
    lng: Number(result.lon),
    placeId: `nominatim:${result.place_id}`,
  }))
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (query.trim().length < 2) {
    return []
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })

  if (!response.ok) {
    throw new Error('Kunne ikke søge efter steder lige nu.')
  }

  const data = (await response.json()) as NominatimResult[]
  return mapNominatimResults(data)
}
