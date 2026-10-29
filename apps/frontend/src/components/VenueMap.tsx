import { MapContainer, Marker, TileLayer } from 'react-leaflet'

interface VenueMapProps {
  lat: number
  lon: number
  name: string
}

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
      <Marker position={[lat, lon]} title={name} />
    </MapContainer>
  )
}
