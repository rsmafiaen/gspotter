const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '')
const OSM_CARTO_STYLE = `${BASE_URL}/map-styles/osm-carto.json`

export const MAP_STYLE_URLS = {
  // The dark theme uses the same style with the washed-out CSS filter that the
  // original OSM raster map used.
  light: OSM_CARTO_STYLE,
  dark: OSM_CARTO_STYLE,
} as const

export const MAP_ATTRIBUTION =
  '© OpenFreeMap © OpenMapTiles Data from OpenStreetMap'
