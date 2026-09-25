import type { Place } from '../../../shared/types/place'

export function parseDestinationNames(raw: string): string[] {
  return raw
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
}

/**
 * Midlertidig placeholder indtil trin 2 (Nominatim-søgning) giver rigtige koordinater.
 */
export function toPlaceholderPlace(name: string): Place {
  return {
    name,
    lat: 0,
    lng: 0,
    placeId: `manual:${name.toLowerCase().replace(/\s+/g, '-')}`,
  }
}
