import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { SetStateAction } from 'react'

import ClientMap from '#/components/ClientMap'
import MockLocationNotice from '#/components/MockLocationNotice'
import NearbyVenuesSidebar from '#/components/NearbyVenuesSidebar'
import SearchBox from '#/components/SearchBox'
import SearchFilters from '#/components/SearchFilters'
import SidebarVenuePagination from '#/components/SidebarVenuePagination'
import { venueToSearchResult } from '#/components/VenueCard'
import { venuesFromPages } from '#/graphql/venues'
import { MOCK_LOCATION } from '#/lib/location'
import {
  parseSearchQueryParams,
  searchFiltersFromQueryParams,
  searchFiltersToQueryParams,
} from '#/lib/search-filters'
import { useDistanceVenues } from '#/lib/use-distance-venues'
import { useUserLocation } from '#/lib/use-user-location'
import type { SearchFilters as SearchFilterValues } from '#/types/search'

export const Route = createFileRoute('/')({
  // Filters and the search box live in the URL so the view can be shared,
  // bookmarked, and restored with the browser's back/forward buttons.
  validateSearch: parseSearchQueryParams,
  component: App,
})

function App() {
  const navigate = Route.useNavigate()
  // Only re-render the page when a filter actually changes; the search term is
  // read directly by SearchBox.
  const searchFilters = Route.useSearch({
    select: searchFiltersFromQueryParams,
  })
  const {
    coordinates,
    locating,
    locationError,
    usingMockLocation,
    refreshLocation,
  } = useUserLocation()

  const updateSearchFilters = useCallback(
    (update: SetStateAction<SearchFilterValues>) => {
      void navigate({
        search: (previous) => {
          const current = searchFiltersFromQueryParams(previous)
          const next = typeof update === 'function' ? update(current) : update

          return { ...previous, ...searchFiltersToQueryParams(next) }
        },
        replace: true,
      })
    },
    [navigate],
  )

  const sentinelRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isFetching,
    isError,
    hasMorePages,
    loadMore,
    isFetchingNextPage,
    isFetchNextPageError,
    setRadiusFromMap,
  } = useDistanceVenues({
    cityId: null,
    filters: searchFilters,
    coordinates,
  })

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (
      !sentinel ||
      !hasMorePages ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          !isFetchingNextPage
        ) {
          loadMore()
        }
      },
      { rootMargin: '600px 0px' },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMorePages, isFetchingNextPage, loadMore])

  const venueResults = useMemo(
    () => venuesFromPages(data).map(venueToSearchResult),
    [data],
  )

  return (
    <main
      id="main-content"
      className="relative h-[calc(100svh-57px)] overflow-hidden sm:h-[calc(100svh-65px)]"
    >
      <h1 className="sr-only">Find pubs near you</h1>

      {/* The map is the page: every control floats above it. */}
      <div className="absolute inset-3 overflow-hidden rounded-3xl bg-(--surface-strong) shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:inset-4">
        <ClientMap
          nearby={venueResults}
          userLocation={coordinates}
          isMockLocation={usingMockLocation}
          center={coordinates ?? MOCK_LOCATION}
          zoom={13}
          onRadiusChange={setRadiusFromMap}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-24 z-950 flex justify-center sm:bottom-4">
        <div className="pointer-events-auto w-full max-w-xl">
          <MockLocationNotice />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-3 flex gap-4 rounded-3xl p-3 sm:inset-4 sm:p-4">
        <NearbyVenuesSidebar
          venues={venueResults}
          hasLocation={coordinates != null}
          locating={locating}
          locationError={locationError}
          isLoading={isFetching}
          isError={isError}
          maxDistanceKm={searchFilters.maxDistanceKm}
          onRefresh={refreshLocation}
          pagination={
            <SidebarVenuePagination
              hasMorePages={hasMorePages}
              isFetchingNextPage={isFetchingNextPage}
              isFetchNextPageError={isFetchNextPageError}
              onLoadMore={loadMore}
              sentinelRef={sentinelRef}
            />
          }
        />

        <div className="pointer-events-auto relative z-950 ml-auto flex w-full max-w-136 flex-col gap-2 self-start">
          <SearchBox coordinates={coordinates} filters={searchFilters} />
          <SearchFilters
            filters={searchFilters}
            coordinates={coordinates}
            onChange={updateSearchFilters}
          />
        </div>
      </div>
    </main>
  )
}
