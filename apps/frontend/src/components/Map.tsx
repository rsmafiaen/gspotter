'use client'

import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Tooltip,
  useMap,
} from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from '@tanstack/react-router'

import { formatPrice } from '../lib/format-price'
import harpIconUrl from '#/assets/harp.svg?url'
import harpShadowUrl from '#/assets/harp_shadow.svg?url'
import { MOCK_LOCATION_NAME } from '../lib/location'
import type { Coordinates } from '../lib/location'
import { MAP_STYLE_URLS } from '../lib/map-styles'
import { useThemeMode } from '../lib/use-theme-mode'
import type { SearchResult } from '../types/search'
import { VectorTileLayer } from './VectorTileLayer'

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
  iconUrl: harpIconUrl,
  shadowUrl: harpShadowUrl,
  iconSize: [46, 46],
  shadowSize: [50, 50],
  iconAnchor: [23, 23],
  shadowAnchor: [25, 25],
  popupAnchor: [0, -25],
})

/**
 * Overlapping pins are merged into a single, larger target. This keeps the map
 * usable on touch screens: without clustering the pins on top of each other
 * cannot be tapped individually (WCAG 2.2 target size).
 */
function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount()

  return L.divIcon({
    html: `<span aria-hidden="true">${count}</span><span class="sr-only">${count} ${
      count === 1 ? 'pub' : 'pubs'
    }, zoom in to see them</span>`,
    className: 'gspotter-cluster',
    iconSize: L.point(44, 44, true),
    iconAnchor: [22, 22],
  })
}

export interface MapProps {
  nearby?: SearchResult[]
  userLocation?: Coordinates | null
  flyTo?: number[]
  isMockLocation?: boolean
}

export default function Map({
  nearby = [],
  userLocation,
  flyTo,
  isMockLocation = false,
}: MapProps) {
  const navigate = useNavigate()
  const themeMode = useThemeMode()
  // Start at the user's position when we already know it. Otherwise Leaflet
  // first downloads tiles for the default view and immediately replaces them
  // after flying to the user, wasting both time and bandwidth.
  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lon]
    : DEFAULT_CENTER
  const initialZoom = userLocation ? 12 : DEFAULT_ZOOM
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
    <section id="map" aria-label="Map of pubs near you" className="relative">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        maxZoom={19}
        scrollWheelZoom={true}
        className="h-100 w-full rounded-2xl"
      >
        <VectorTileLayer styleUrl={MAP_STYLE_URLS[themeMode]} />
        <FlyToResult coordinates={flyTo} />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={60}
          showCoverageOnHover={false}
          iconCreateFunction={createClusterIcon}
        >
          {markers.map((curr) => (
            <Marker
              key={`${curr.type}-${curr.name}-${curr.lat}-${curr.lon}`}
              icon={harpIcon}
              position={[curr.lat, curr.lon]}
              title={curr.name}
              alt={curr.name}
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
        </MarkerClusterGroup>
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
