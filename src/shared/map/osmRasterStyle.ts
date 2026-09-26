import type { StyleSpecification } from 'maplibre-gl'

/**
 * Simpelt raster-basemap uden API-nøgle (OpenStreetMap-fliser).
 * Ingen Google Maps-afhængighed. Kan senere skiftes til et vektor-style
 * med API-nøgle (MapTiler/Stadia) hvis mere visuel detalje ønskes.
 */
export const osmRasterStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap-bidragydere',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}
