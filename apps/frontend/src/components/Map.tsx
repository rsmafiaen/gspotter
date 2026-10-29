'use client'

import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from '@tanstack/react-router'

import { formatPrice } from '../lib/format-price'
import { assetUrl } from '#/lib/asset-url'
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
  iconUrl: assetUrl('harp.svg'),
  shadowUrl: assetUrl('harp_shadow.svg'),
  iconSize: [46, 46],
  shadowSize: [50, 50],
  iconAnchor: [23, 23],
  shadowAnchor: [25, 25],
  popupAnchor: [0, -25],
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
  const navigate = useNavigate()
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
        scrollWheelZoom={true}
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
            eventHandlers={{
              click: () => {
                if (curr.cityId) {
                  void navigate({
                    to: '/$cityId/venues/$venueId',
                    params: { cityId: curr.cityId, venueId: curr.id },
                  })
                }
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -20]}>
              <strong>{curr.name}</strong>
              {curr.address && <span className="block">{curr.address}</span>}
              {curr.latestPriceSighting && (
                <span className="block">
                  {formatPrice(curr.latestPriceSighting)}
                </span>
              )}
            </Tooltip>
          </Marker>
        ))}
        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lon]}
            radius={8}
            pathOptions={{
              color: '#d3ad57',
              fillColor: '#e6c77f',
              fillOpacity: 0.85,
            }}
          >
            <Tooltip direction="top" offset={[0, -12]}>
              {isMockLocation
                ? `Mock location: ${MOCK_LOCATION_NAME}`
                : 'Your location'}
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </section>
  )
}
