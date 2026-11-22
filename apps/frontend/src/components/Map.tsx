'use client'

import { useEffect } from 'react'
import { MapContainer, Marker, Tooltip, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useNavigate } from '@tanstack/react-router'

import { formatPrice } from '../lib/format-price'
import harpIconUrl from '#/assets/harp.svg?url'
import harpShadowUrl from '#/assets/harp_shadow.svg?url'
import { MOCK_LOCATION, MOCK_LOCATION_NAME } from '../lib/location'
import type { Coordinates } from '../lib/location'
import { MAP_STYLE_URLS } from '../lib/map-styles'
import { useThemeMode } from '../lib/use-theme-mode'
import type { SearchResult } from '../types/search'
import { VectorTileLayer } from './VectorTileLayer'

// Both SSR posters are centred on the mock location at this zoom, so the live
// map starts on exactly the same frame and then flies to the user.
const POSTER_CENTER: [number, number] = [MOCK_LOCATION.lat, MOCK_LOCATION.lon]
const POSTER_ZOOM = 3
const USER_ZOOM = 13

function FlyToUser({ location }: { location?: Coordinates | null }) {
  const map = useMap()
  const lat = location?.lat
  const lon = location?.lon

  useEffect(() => {
    if (lat == null || lon == null) return

    // Let the poster's first frame paint, then fly in from its view.
    const timeout = window.setTimeout(() => {
      map.flyTo([lat, lon], USER_ZOOM, {
        duration: 1.6,
        easeLinearity: 0.25,
      })
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [lat, lon, map])

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

const userLocationIcon = L.divIcon({
  className: 'gspotter-user-location',
  html: '<span class="gspotter-user-location__dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

function UserLocationMarker({
  location,
  isMockLocation,
}: {
  location: Coordinates
  isMockLocation: boolean
}) {
  const map = useMap()
  const label = isMockLocation
    ? `Mock location: ${MOCK_LOCATION_NAME}`
    : 'Your location'

  useEffect(() => {
    const container = map.getContainer()
    const setDotScale = (scale: number) => {
      container.style.setProperty('--gspotter-dot-scale', String(scale))
    }

    let frame = 0
    let animating = false

    // Leaflet animates a marker by scaling its icon element with a CSS
    // transition. Read that live scale each frame and apply its inverse to the
    // dot so it keeps the same on-screen size throughout the zoom.
    const readIconScale = () => {
      const icon = container.querySelector<HTMLElement>(
        '.gspotter-user-location',
      )
      if (!icon) return 1

      const transform = window.getComputedStyle(icon).transform
      const values = transform.match(/matrix(?:3d)?\(([^)]+)\)/)?.[1]
      if (!values) return 1

      const [a = 1, b = 0] = values.split(',').map(Number)
      const scale = Math.hypot(a, b)
      return scale > 0 ? scale : 1
    }

    const tick = () => {
      setDotScale(1 / readIconScale())
      frame = window.requestAnimationFrame(tick)
    }

    const start = () => {
      if (animating) return
      animating = true
      frame = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      if (!animating) return
      animating = false
      window.cancelAnimationFrame(frame)
      setDotScale(1)
    }

    map.on('zoomstart', start)
    map.on('zoomanim', start)
    map.on('zoomend', stop)

    return () => {
      map.off('zoomstart', start)
      map.off('zoomanim', start)
      map.off('zoomend', stop)
      window.cancelAnimationFrame(frame)
      setDotScale(1)
    }
  }, [map])

  return (
    <Marker
      position={[location.lat, location.lon]}
      icon={userLocationIcon}
      title={label}
      alt={label}
    >
      <Tooltip direction="top" offset={[0, -14]}>
        {label}
      </Tooltip>
    </Marker>
  )
}

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
  isMockLocation?: boolean
}

export default function Map({
  nearby = [],
  userLocation,
  isMockLocation = false,
}: MapProps) {
  const navigate = useNavigate()
  const themeMode = useThemeMode()
  // Always start on the poster's view, then fly to the user once it is known.
  const initialCenter: [number, number] = POSTER_CENTER
  const initialZoom = POSTER_ZOOM
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
        <FlyToUser location={userLocation} />
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
          <UserLocationMarker
            location={userLocation}
            isMockLocation={isMockLocation}
          />
        )}
      </MapContainer>
    </section>
  )
}
