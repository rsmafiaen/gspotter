import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

export default function Map() {
  return (
    <section id="map">
        <MapContainer center={[63.4305, 10.3951]} zoom={15} scrollWheelZoom={false} className="h-100 w-full rounded-2xl">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[63.4305, 10.3951]}>
                <Popup>
                    <span>Guinness!!!</span>
                </Popup>
            </Marker>
        </MapContainer>
    </section>
    )
}