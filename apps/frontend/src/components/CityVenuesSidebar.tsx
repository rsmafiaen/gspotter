import { Link } from '@tanstack/react-router'
import type { RefObject } from 'react'

import { useUserTimeZone } from '#/lib/use-user-time-zone'
import type { SearchResult } from '#/types/search'
import MapSidebar from './MapSidebar'
import { NearbyVenueRow, venueRowClassName } from './NearbyVenues'
import SidebarVenuePagination from './SidebarVenuePagination'

interface CityVenuesSidebarProps {
  cityName: string | null
  venues: SearchResult[]
  totalVenues: number
  isPending: boolean
  isError: boolean
  hasMorePages: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  locating: boolean
  locationError: string | null
  onLoadMore: () => void
  onRefresh: () => void
  sentinelRef: RefObject<HTMLDivElement | null>
}

export default function CityVenuesSidebar({
  cityName,
  venues,
  totalVenues,
  isPending,
  isError,
  hasMorePages,
  isFetchingNextPage,
  isFetchNextPageError,
  locating,
  locationError,
  onLoadMore,
  onRefresh,
  sentinelRef,
}: CityVenuesSidebarProps) {
  const timeZone = useUserTimeZone()
  const title = cityName ? `Venues in ${cityName}` : 'City venues'

  return (
    <MapSidebar
      title={title}
      label="city venues"
      onRefresh={onRefresh}
      refreshing={locating}
    >
      {locationError && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">{locationError}</p>
      )}

      {isPending && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">Loading venues…</p>
      )}

      {!isPending && isError && venues.length === 0 && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">
          Could not load venues.
        </p>
      )}

      {!isPending && !isError && venues.length === 0 && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">
          No venues found in this city.
        </p>
      )}

      {venues.length > 0 && (
        <>
          <p className="mt-3 text-xs font-bold text-(--sea-ink-soft)">
            {hasMorePages && venues.length < totalVenues
              ? `${venues.length} of ${totalVenues} venues loaded`
              : `${totalVenues} ${totalVenues === 1 ? 'venue' : 'venues'}`}
          </p>

          <ul className="striped-list venue-list mt-3">
            {venues.map((venue) => (
              <li key={venue.id}>
                <Link
                  to="/$cityId/venues/$venueId"
                  params={{ cityId: venue.cityId ?? '', venueId: venue.id }}
                  className={venueRowClassName}
                >
                  <NearbyVenueRow venue={venue} timeZone={timeZone} />
                </Link>
              </li>
            ))}
          </ul>

          <SidebarVenuePagination
            hasMorePages={hasMorePages}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            onLoadMore={onLoadMore}
            sentinelRef={sentinelRef}
          />
        </>
      )}
    </MapSidebar>
  )
}
