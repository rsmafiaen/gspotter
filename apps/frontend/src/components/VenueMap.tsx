import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'

import { assetUrl } from '#/lib/asset-url'

interface VenueMapProps {
  lat: number
  lon: number
  name: string
}

const harpIcon = new L.Icon({
  iconUrl: assetUrl('harp.svg'),
  shadowUrl: assetUrl('harp_shadow.svg'),
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]} icon={harpIcon} title={name} />
    </MapContainer>
  )
}
