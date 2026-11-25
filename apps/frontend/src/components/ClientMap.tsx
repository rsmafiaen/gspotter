import { lazy, Suspense, useEffect, useState } from 'react'
import type { ComponentProps } from 'react'

import mapPosterDark from '#/assets/map-poster-dark.avif'
import mapPosterLight from '#/assets/map-poster-light.avif'
import { MAP_ATTRIBUTION } from '#/lib/map-styles'
import type MapComponent from './Map'

// Leaflet touches `window` while its module is evaluated, so it may only be
// imported in the browser. Kick the import off while the rest of the page is
// still hydrating, instead of waiting for the map to mount.
const mapModulePromise = import.meta.env.SSR ? null : import('./Map')

// The dynamic import also moves Leaflet into its own chunk, keeping it out of
// the JavaScript needed for the first paint.
const LazyMap = mapModulePromise ? lazy(() => mapModulePromise) : null

type MapProps = ComponentProps<typeof MapComponent>

/**
 * Pictures of the map's default view (Trondheim, zoom 3) rendered on the
 * server, one per theme. The map is the largest thing on the first screen, so
 * pulling that paint out of the JavaScript bundle lets the browser show it
 * immediately instead of waiting for Leaflet and a handful of map tiles.
 *
 * Regenerate them by screenshotting `#map` at a 1280px viewport width with the
 * mock location (968x400), then encode each to AVIF at quality ~35.
 */
function MapPoster({ ready }: { ready: boolean }) {
  return (
    <>
      <img
        src={mapPosterLight}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="map-poster-light h-full w-full object-cover"
      />
      <img
        src={mapPosterDark}
        alt=""
        fetchPriority="high"
        decoding="async"
        className="map-poster-dark h-full w-full object-cover"
      />
      {/* The live map brings its own attribution control. */}
      <span
        hidden={ready}
        className="absolute right-0 bottom-0 bg-white/80 px-1 text-[10px] leading-4 text-[#333]"
      >
        {MAP_ATTRIBUTION}
      </span>
    </>
  )
}

export default function ClientMap(props: MapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const ready = mounted && LazyMap != null

  return (
    <div className="relative h-full w-full">
      {/* The map fades in on top of the poster rather than the poster fading
          out, so the poster stays painted and remains the LCP element. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] bg-(--surface-strong)"
      >
        <MapPoster ready={ready} />
      </div>
      {ready && (
        <div className="map-fade-in absolute inset-0 z-10">
          <Suspense fallback={null}>
            <LazyMap {...props} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
