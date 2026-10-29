import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Map from '../components/Map'
import MockLocationNotice from '#/components/MockLocationNotice'
import NearbyVenues from '#/components/NearbyVenues'
import type { SearchResult } from '#/types/search'
import type { NearbyVenue, VenuePriceSighting } from '#/types/venue'
import SearchBox from '#/components/SearchBox'
import { graphqlFetch } from '#/graphql/client'
import {
  MOCK_LOCATION,
  describeLocationError,
  readStoredLocation,
  requestAndStoreLocation,
  usesMockLocation,
} from '#/lib/location'
import type { Coordinates } from '#/lib/location'

export const Route = createFileRoute('/')({ component: App })

const NEARBY_LIMIT = 5
const NEARBY_MAX_DISTANCE_KM = 10

const NEARBY_QUERY = `
  query NearbyVenues(
    $lat: Float!
    $lon: Float!
    $limit: Int!
    $maxDistanceKm: Float!
  ) {
    venue(
      lat: $lat
      lon: $lon
      limit: $limit
      maxDistanceKm: $maxDistanceKm
    ) {
      id
      name
      address
      lat
      lon
      city {
        id
      }
      openingHours {
        days
        opening
        closing
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
    type: 'venue',
    name: venue.name,
    lat: venue.lat,
    lon: venue.lon,
    address: venue.address,
    openingHours: venue.openingHours,
    latestPriceSighting: latestPriceSighting(venue.pricesSighted),
    averageRating: averageRating(venue.reviews),
    reviewCount: venue.reviews.length,
  }
}

function App() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
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

  const { data, isFetching, isError } = useQuery({
    queryKey: ['nearbyVenues', coordinates?.lat, coordinates?.lon],
    queryFn: () =>
      graphqlFetch<{ venue: NearbyVenue[] }>(NEARBY_QUERY, {
        lat: coordinates!.lat,
        lon: coordinates!.lon,
        limit: NEARBY_LIMIT,
        maxDistanceKm: NEARBY_MAX_DISTANCE_KM,
      }),
    enabled: coordinates != null,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const nearbyVenues = useMemo(
    () => (data?.venue ?? []).map(toSearchResult),
    [data],
  )

  const flyTo = useMemo(() => {
    if (coordinates) return [coordinates.lat, coordinates.lon]

    return undefined
  }, [coordinates])

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {usingMockLocation && <MockLocationNotice />}
      <section className="island-shell rise-in relative overflow-hidden rounded-4xl px-6 py-10 sm:px-10 sm:py-14 mb-10">
        <SearchBox />
        <Map
          nearby={nearbyVenues}
          userLocation={coordinates}
          flyTo={flyTo}
          isMockLocation={usingMockLocation}
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
          onRefresh={refreshLocation}
        />
      </div>
    </main>
  )
}
