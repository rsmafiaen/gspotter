import { lazy, Suspense, useEffect, useState } from 'react'
import type { ComponentProps } from 'react'

import mapPlaceholder from '#/assets/map-placeholder.svg'
import type VenueMapComponent from './VenueMap'

const venueMapModulePromise = import.meta.env.SSR ? null : import('./VenueMap')
const LazyVenueMap = venueMapModulePromise
  ? lazy(() => venueMapModulePromise)
  : null

type VenueMapProps = ComponentProps<typeof VenueMapComponent>

/**
 * A neutral map skeleton is rendered on the server so this block is painted
 * immediately instead of waiting for Leaflet and a handful of tiles: the tiles
 * arrive seconds later and would otherwise win the LCP race on this page. The
 * live map fades in on top and the skeleton stays painted underneath, which
 * keeps it a valid LCP candidate.
 */
export default function ClientVenueMap(props: VenueMapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const ready = mounted && LazyVenueMap != null

  return (
    <div className="relative h-full w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl bg-(--surface-strong)"
      >
        <img
          src={mapPlaceholder}
          alt=""
          decoding="async"
          className="h-full w-full object-cover"
        />
      </div>
      {ready && (
        <div className="map-fade-in absolute inset-0 z-10">
          <Suspense fallback={null}>
            <LazyVenueMap {...props} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
