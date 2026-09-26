import type { CircleLayerSpecification, GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl'

/**
 * Opretter, opdaterer eller fjerner et prik-lag (source + layer med samme id).
 * Tegnes i pixels, så punkterne kan ses uanset zoomniveau — modsat en kort
 * linje, der forsvinder når kortet er zoomet langt ud.
 */
export function setCircleLayer(
  map: MapLibreMap,
  id: string,
  points: { lat: number; lng: number }[],
  paint: CircleLayerSpecification['paint'],
): void {
  const existing = map.getSource(id) as GeoJSONSource | undefined

  if (points.length === 0) {
    if (existing) {
      map.removeLayer(id)
      map.removeSource(id)
    }
    return
  }

  const geojson: GeoJSON.Feature<GeoJSON.MultiPoint> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'MultiPoint', coordinates: points.map((p) => [p.lng, p.lat]) },
  }

  if (existing) {
    existing.setData(geojson)
  } else {
    map.addSource(id, { type: 'geojson', data: geojson })
    map.addLayer({ id, type: 'circle', source: id, paint })
  }
}
