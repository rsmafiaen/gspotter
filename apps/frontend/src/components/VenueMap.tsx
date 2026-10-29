import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import harpIconUrl from '#/assets/harp.svg?url'
import harpShadowUrl from '#/assets/harp_shadow.svg?url'

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
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={16}
      className="h-64 w-full rounded-xl"
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      zoomControl={false}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]} icon={harpIcon} title={name} alt={name} />
    </MapContainer>
  )
}
