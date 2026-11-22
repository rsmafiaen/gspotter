import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ClientMap from '#/components/ClientMap'
import MockLocationNotice from '#/components/MockLocationNotice'
import NearbyVenues from '#/components/NearbyVenues'
import SearchBox from '#/components/SearchBox'
import SearchFilters from '#/components/SearchFilters'
import { graphqlFetch } from '#/graphql/client'
import {
  MOCK_LOCATION,
  describeLocationError,
  readStoredLocation,
  requestAndStoreLocation,
  usesMockLocation,
} from '#/lib/location'
import type { Coordinates } from '#/lib/location'
import {
  EMPTY_SEARCH_FILTERS,
  searchFilterVariables,
} from '#/lib/search-filters'
import type {
  SearchFilters as SearchFilterValues,
  SearchResult,
} from '#/types/search'
import type { NearbyVenue, VenuePriceSighting } from '#/types/venue'

export const Route = createFileRoute('/')({ component: App })

const NEARBY_LIST_LIMIT = 5

// The map shows every venue matching the filters. The list below the map is a
// short nearby preview, so we only slice its data client-side.
const NEARBY_QUERY = `
  query NearbyVenues(
    $lat: Float!
    $lon: Float!
    $maxDistanceKm: Float
    $minPrice: Float
    $maxPrice: Float
    $sizes: [GlassSize!]
    $minRating: Float
  ) {
    venue(
      lat: $lat
      lon: $lon
      maxDistanceKm: $maxDistanceKm
      minPrice: $minPrice
      maxPrice: $maxPrice
      sizes: $sizes
      minRating: $minRating
    ) {
      id
      name
      address
      lat
      lon
      city {
        id
        name
      }
      openingHours {
        days
        opening
        closing
      }
      openingHoursNotes {
        days
        note
      }
      pricesSighted {
        price
        size
        sizeMl
        Limitations
        timeStart
        timeEnd
        timeSighted
      }
      reviews {
        rating
      }
    }
  }
`

function averageRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return null

  return (
    reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
  )
}

function latestPriceSighting(sightings: VenuePriceSighting[]) {
  return sightings.reduce<VenuePriceSighting | null>((latest, sighting) => {
    if (
      latest === null ||
      new Date(sighting.timeSighted) > new Date(latest.timeSighted)
    ) {
      return sighting
    }

    return latest
  }, null)
}

function toSearchResult(venue: NearbyVenue): SearchResult {
  return {
    id: venue.id,
    cityId: venue.city.id,
    cityName: venue.city.name,
    type: 'venue',
    name: venue.name,
    lat: venue.lat,
    lon: venue.lon,
    address: venue.address,
    openingHours: venue.openingHours,
    openingHoursNotes: venue.openingHoursNotes,
    latestPriceSighting: latestPriceSighting(venue.pricesSighted),
    averageRating: averageRating(venue.reviews),
    reviewCount: venue.reviews.length,
  }
}

function App() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [searchFilters, setSearchFilters] =
    useState<SearchFilterValues>(EMPTY_SEARCH_FILTERS)
  const [locating, setLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [usingMockLocation, setUsingMockLocation] = useState(false)
  const initialized = useRef(false)

  const refreshLocation = useCallback(async () => {
    setLocationError(null)

    // Browsers block geolocation outside secure contexts, so on plain HTTP the
    // only option is a fixed, clearly announced mock position.
    if (usesMockLocation()) {
      setUsingMockLocation(true)
      setCoordinates(MOCK_LOCATION)
      setLocating(false)
      return
    }

    setLocating(true)

    try {
      setCoordinates(await requestAndStoreLocation())
    } catch (error) {
      setLocationError(describeLocationError(error))
    } finally {
      setLocating(false)
    }
  }, [])

  // Reuse the location from the last 24 hours, otherwise ask the browser once.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (usesMockLocation()) {
      void refreshLocation()
      return
    }

    const stored = readStoredLocation()

    if (stored) {
      setCoordinates(stored)
      setLocating(false)
      return
    }

    void refreshLocation()
  }, [refreshLocation])

  const nearbyVariables = useMemo(
    () => searchFilterVariables(searchFilters, coordinates),
    [searchFilters, coordinates],
  )

  const { data, isFetching, isError } = useQuery({
    queryKey: ['nearbyVenues', nearbyVariables],
    queryFn: () =>
      graphqlFetch<{ venue: NearbyVenue[] }>(NEARBY_QUERY, nearbyVariables),
    enabled: coordinates != null,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const venueResults = useMemo(
    () => (data?.venue ?? []).map(toSearchResult),
    [data],
  )
  const nearbyVenues = useMemo(
    () => venueResults.slice(0, NEARBY_LIST_LIMIT),
    [venueResults],
  )

  return (
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <h1 className="sr-only">Find pubs near you</h1>
      <MockLocationNotice />
      {/* No `rise-in` here: the map poster inside this section must be painted
          on the first frame, and an animation that starts at opacity: 0 keeps
          it from being reported as the LCP element. */}
      <section className="island-shell relative mb-10 overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="mb-3 flex justify-end">
          <SearchBox coordinates={coordinates} filters={searchFilters} />
        </div>
        <ClientMap
          nearby={venueResults}
          userLocation={coordinates}
          isMockLocation={usingMockLocation}
        />
        <SearchFilters
          filters={searchFilters}
          coordinates={coordinates}
          onChange={setSearchFilters}
        />
      </section>
      <div className="mt-4">
        <NearbyVenues
          venues={nearbyVenues}
          hasLocation={coordinates != null}
          locating={locating}
          locationError={locationError}
          isLoading={isFetching}
          isError={isError}
          maxDistanceKm={searchFilters.maxDistanceKm}
          onRefresh={refreshLocation}
        />
      </div>
    </main>
  )
}
