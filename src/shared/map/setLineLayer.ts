import type { GeoJSONSource, LineLayerSpecification, Map as MapLibreMap } from 'maplibre-gl'

/**
 * Opretter, opdaterer eller fjerner et linje-lag (source + layer med samme
 * id) ud fra en liste af linjer. Linjer med under to punkter ignoreres; er
 * der ingen tilbage, fjernes laget.
 */
export function setLineLayer(
  map: MapLibreMap,
  id: string,
  lines: { lat: number; lng: number }[][],
  paint: LineLayerSpecification['paint'],
): void {
  const drawable = lines.filter((line) => line.length > 1)
  const existing = map.getSource(id) as GeoJSONSource | undefined

  if (drawable.length === 0) {
    if (existing) {
      map.removeLayer(id)
      map.removeSource(id)
    }
    return
  }

  const geojson: GeoJSON.Feature<GeoJSON.MultiLineString> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiLineString',
      coordinates: drawable.map((line) => line.map((point) => [point.lng, point.lat])),
    },
  }

  if (existing) {
    existing.setData(geojson)
  } else {
    map.addSource(id, { type: 'geojson', data: geojson })
    map.addLayer({ id, type: 'line', source: id, paint })
  }
}
