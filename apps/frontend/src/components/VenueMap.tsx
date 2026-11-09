import { MapContainer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import harpIconUrl from '#/assets/harp.svg?url'
import harpShadowUrl from '#/assets/harp_shadow.svg?url'
import { MAP_STYLE_URLS } from '#/lib/map-styles'
import { useThemeMode } from '#/lib/use-theme-mode'
import { VectorTileLayer } from './VectorTileLayer'

export interface VenueMapProps {
  lat: number
  lon: number
  name: string
}

const harpIcon = new L.Icon({
  iconUrl: harpIconUrl,
  shadowUrl: harpShadowUrl,
  iconSize: [46, 46],
  shadowSize: [50, 50],
  iconAnchor: [23, 23],
  shadowAnchor: [25, 25],
  popupAnchor: [0, -20],
})

export default function VenueMap({ lat, lon, name }: VenueMapProps) {
  const themeMode = useThemeMode()

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={16}
      maxZoom={19}
      className="h-full w-full rounded-xl"
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
    >
      <VectorTileLayer styleUrl={MAP_STYLE_URLS[themeMode]} />
      <Marker position={[lat, lon]} icon={harpIcon} title={name} alt={name} />
    </MapContainer>
  )
}
