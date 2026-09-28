import type { Place } from '../types/place'

type NominatimAddress = Partial<
  Record<
    'city' | 'town' | 'village' | 'municipality' | 'hamlet' | 'county' | 'state' | 'country',
    string
  >
>

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

/**
 * Nominatims display_name er hele adressehierarkiet (f.eks.
 * "Rom, Roma Capitale, Lazio, Italien") — for langt til lister og
 * kort-markører, så vi bruger kun det første, mest specifikke led.
 */
function shortenDisplayName(displayName: string): string {
  return displayName.split(',')[0]?.trim() || displayName
}

/**
 * By og land, f.eks. "Málaga, Spanien" — så to steder med samme navn kan
 * skelnes. Byen udelades, hvis den er selve stedet (søgning på en by).
 */
function describeArea(name: string, address: NominatimAddress | undefined): string | undefined {
  if (!address) return undefined
  const locality =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.hamlet ??
    address.county ??
    address.state
  const parts = [locality !== name ? locality : undefined, address.country].filter(
    (part): part is string => Boolean(part) && part !== name,
  )
  return parts.length > 0 ? parts.join(', ') : undefined
}

export function mapNominatimResults(results: NominatimResult[]): Place[] {
  return results.map((result) => {
    const name = shortenDisplayName(result.display_name)
    const area = describeArea(name, result.address)
    return {
      name,
      lat: Number(result.lat),
      lng: Number(result.lon),
      placeId: `nominatim:${result.place_id}`,
      // Firestore afviser undefined-felter, så area kun med, når det findes.
      ...(area ? { area } : {}),
    }
  })
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  if (query.trim().length < 2) {
    return []
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&accept-language=da&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })

  if (!response.ok) {
    throw new Error('Kunne ikke søge efter steder lige nu.')
  }

  const data = (await response.json()) as NominatimResult[]
  return mapNominatimResults(data)
}
