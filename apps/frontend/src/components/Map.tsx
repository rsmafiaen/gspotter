'use client'

import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'

import { formatPrice } from '../lib/format-price'
import { MOCK_LOCATION_NAME } from '../lib/location'
import type { Coordinates } from '../lib/location'
import type { SearchResult } from '../types/search'

const DEFAULT_CENTER: [number, number] = [63.4305, 10.3951]
const DEFAULT_ZOOM = 15

function FlyToResult({ coordinates }: { coordinates: number[] | undefined }) {
  const map = useMap()

  useEffect(() => {
    if (coordinates && coordinates.length == 2) {
      map.flyTo([coordinates[0], coordinates[1]], 12)
    }
  }, [coordinates, map])

  return null
}

const harpIcon = new L.Icon({
  iconUrl: 'harp.svg',
  shadowUrl: 'harp_shadow.svg',
  iconSize: [46, 46],
  shadowSize: [50, 50],
  iconAnchor: [23, 23],
  shadowAnchor: [25, 25],
  popupAnchor: [0, -47.5],
})

export default function Map({
  nearby = [],
  userLocation,
  flyTo,
  isMockLocation = false,
}: {
  nearby?: SearchResult[]
  userLocation?: Coordinates | null
  flyTo?: number[]
  isMockLocation?: boolean
}) {
  const markers = nearby.filter(
    (venue, index, all) =>
      all.findIndex(
        (other) =>
          other.name === venue.name &&
          other.lat === venue.lat &&
          other.lon === venue.lon,
      ) === index,
  )

  return (
    <section id="map" className="relative">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="h-100 w-full rounded-2xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToResult coordinates={flyTo} />
        {markers.map((curr) => (
          <Marker
            key={`${curr.type}-${curr.name}-${curr.lat}-${curr.lon}`}
            icon={harpIcon}
            position={[curr.lat, curr.lon]}
          >
            <Popup>
              <strong>{curr.name}</strong>
              {curr.address && <span className="block">{curr.address}</span>}
              {curr.latestPriceSighting && (
                <span className="block">
                  {formatPrice(curr.latestPriceSighting)}
                </span>
              )}
            </Popup>
          </Marker>
        ))}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lon]}
            radius={8}
            pathOptions={{
              color: '#328f97',
              fillColor: '#4fb8b2',
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              {isMockLocation
                ? `Mock location: ${MOCK_LOCATION_NAME}`
                : 'Your location'}
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </section>
  )
}
