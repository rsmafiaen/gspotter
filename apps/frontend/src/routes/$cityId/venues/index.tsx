import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SetStateAction } from 'react'

import CityVenuesSidebar from '#/components/CityVenuesSidebar'
import ClientMap from '#/components/ClientMap'
import MockLocationNotice from '#/components/MockLocationNotice'
import SearchBox from '#/components/SearchBox'
import SearchFilters from '#/components/SearchFilters'
import { venueToSearchResult } from '#/components/VenueCard'
import { venueCountFromPages, venuesFromPages } from '#/graphql/venues'
import type { Coordinates } from '#/lib/location'
import {
  parseSearchQueryParams,
  searchFiltersFromQueryParams,
  searchFiltersToQueryParams,
} from '#/lib/search-filters'
import { useDistanceVenues } from '#/lib/use-distance-venues'
import { useUserLocation } from '#/lib/use-user-location'
import type { SearchFilters as SearchFilterValues } from '#/types/search'

export const Route = createFileRoute('/$cityId/venues/')({
  validateSearch: parseSearchQueryParams,
  component: CityVenuesPage,
})

function CityVenuesPage() {
  const { cityId } = Route.useParams()
  const navigate = Route.useNavigate()
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
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [cityCoordinates, setCityCoordinates] = useState<Coordinates | null>(
    null,
  )

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

  const {
    data,
    isPending,
    isError,
    isFetchNextPageError,
    hasMorePages,
    loadMore,
    isFetchingNextPage,
    setRadiusFromMap,
  } = useDistanceVenues({
    cityId,
    filters: searchFilters,
    coordinates: cityCoordinates,
    enabled: true,
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

  const venues = useMemo(() => venuesFromPages(data), [data])
  const totalVenues = venueCountFromPages(data) ?? venues.length
  const knownCity = useRef<{ name: string; lat: number; lon: number } | null>(
    null,
  )

  if (venues[0]) {
    knownCity.current = {
      name: venues[0].city.name,
      lat: venues[0].city.lat,
      lon: venues[0].city.lon,
    }
  }

  const city = knownCity.current
  const cityName = city?.name ?? null
  const center =
    cityCoordinates ?? (city ? { lat: city.lat, lon: city.lon } : null)
  const venueResults = useMemo(() => venues.map(venueToSearchResult), [venues])

  useEffect(() => {
    const cityVenue = venues.at(0)

    if (!cityVenue) return

    setCityCoordinates(
      (current) =>
        current ?? { lat: cityVenue.city.lat, lon: cityVenue.city.lon },
    )
  }, [venues])

  return (
    <main
      id="main-content"
      className="relative h-[calc(100svh_-_57px)] overflow-hidden sm:h-[calc(100svh_-_65px)]"
    >
      <h1 className="sr-only">
        {cityName ? `Venues in ${cityName}` : 'City venues'}
      </h1>

      <div className="absolute inset-3 overflow-hidden rounded-3xl bg-(--surface-strong) shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:inset-4">
        <ClientMap
          nearby={venueResults}
          userLocation={coordinates}
          isMockLocation={usingMockLocation}
          center={center}
          zoom={13}
          flyToUser={false}
          onRadiusChange={setRadiusFromMap}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-24 z-[950] flex justify-center sm:bottom-4">
        <div className="pointer-events-auto w-full max-w-xl">
          <MockLocationNotice />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-3 flex gap-4 rounded-3xl p-3 sm:inset-4 sm:p-4">
        <CityVenuesSidebar
          cityName={cityName}
          venues={venueResults}
          totalVenues={totalVenues}
          isPending={isPending}
          isError={isError}
          hasMorePages={hasMorePages}
          isFetchingNextPage={isFetchingNextPage}
          isFetchNextPageError={isFetchNextPageError}
          locating={locating}
          locationError={locationError}
          onLoadMore={loadMore}
          onRefresh={() => void refreshLocation()}
          sentinelRef={sentinelRef}
        />

        <div className="pointer-events-auto relative z-[950] ml-auto flex w-full max-w-136 flex-col gap-2 self-start">
          <SearchBox
            coordinates={coordinates}
            filters={searchFilters}
            from="/$cityId/venues/"
          />
          <SearchFilters
            filters={searchFilters}
            coordinates={cityCoordinates}
            onChange={updateSearchFilters}
          />
        </div>
      </div>
    </main>
  )
}
