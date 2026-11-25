import { infiniteQueryOptions, keepPreviousData } from '@tanstack/react-query'

import {
  EMPTY_SEARCH_FILTERS,
  searchFilterVariables,
} from '#/lib/search-filters'
import type { Coordinates } from '#/lib/location'
import type { SearchFilters } from '#/types/search'
import type { venue } from '#/types/venue'
import { graphqlFetch } from './client'

export const CREATE_VENUE = `
  mutation CreateVenue($input: MutationCreateVenueInput!) {
    createVenue(input: $input) {
      id
      name
      address
      lat
      lon
      city {
        id
        name
        lat
        lon
      }
    }
  }
`

export const GET_VENUE = `
  query GetVenues {
    venue {
      id
      name
      address
      lat
      lon
      city {
        id
        name
        lat
        lon
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
        id
        username
        body
        rating
        timeCreated
      }
    }
  }
`

export const VENUES_PAGE_SIZE = 5
/** The first page starts inside this radius. */
export const INITIAL_DISTANCE_KM = 1
/** Upper bound for zoom-driven distance pagination. */
export const MAX_DISTANCE_KM = 100

export const GET_CITY_VENUES = `
  query VenuePages(
    $cityId: String
    $limit: Int!
    $cursor: String
    $includeCount: Boolean!
    $lat: Float
    $lon: Float
    $maxDistanceKm: Float
    $minPrice: Float
    $maxPrice: Float
    $sizes: [GlassSize!]
    $minRating: Float
  ) {
    venue(
      cityId: $cityId
      limit: $limit
      cursor: $cursor
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
        lat
        lon
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
        id
        username
        body
        rating
        timeCreated
      }
    }
    venueCount(
      cityId: $cityId
      lat: $lat
      lon: $lon
      maxDistanceKm: $maxDistanceKm
      minPrice: $minPrice
      maxPrice: $maxPrice
      sizes: $sizes
      minRating: $minRating
    ) @include(if: $includeCount)
  }
`

export interface VenuesPage {
  venue: venue[]
  venueCount?: number
}

export function venuesFromPages(
  data: { pages: VenuesPage[] } | undefined,
): venue[] {
  return data?.pages.flatMap((page) => page.venue) ?? []
}

export function venueCountFromPages(
  data: { pages: VenuesPage[] } | undefined,
): number | undefined {
  return data?.pages.at(-1)?.venueCount
}

export interface VenuePageParams {
  cursor: string | null
  maxDistanceKm: number
}

function lastLoadedVenueId(pages: VenuesPage[]): string | null {
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    const lastVenue = pages[index].venue.at(-1)

    if (lastVenue) return lastVenue.id
  }

  return null
}

/**
 * Distance-based infinite venue pages. Every page continues after the previous
 * page's last venue and doubles the requested radius, so scrolling the sidebar
 * walks outward through distance while zooming out can prefetch the same bands.
 */
export const distanceVenuesQueryOptions = (
  cityId: string | null,
  filters: SearchFilters = EMPTY_SEARCH_FILTERS,
  coordinates: Coordinates | null = null,
  enabled = coordinates != null,
  getTargetDistanceKm?: () => number,
) => {
  const filterVariables = searchFilterVariables(filters, coordinates)
  const filterMaxDistance =
    typeof filterVariables.maxDistanceKm === 'number'
      ? filterVariables.maxDistanceKm
      : null
  const maxDistanceKm = Math.max(0.1, filterMaxDistance ?? MAX_DISTANCE_KM)
  const initialDistanceKm = Math.min(INITIAL_DISTANCE_KM, maxDistanceKm)
  const initialPageParam: VenuePageParams = {
    cursor: null,
    maxDistanceKm: initialDistanceKm,
  }
  const { maxDistanceKm: _filterMaxDistance, ...pageFilterVariables } =
    filterVariables
  const targetDistanceKm = () =>
    Math.min(getTargetDistanceKm?.() ?? maxDistanceKm, maxDistanceKm)

  return infiniteQueryOptions({
    queryKey: ['venuePages', cityId, pageFilterVariables, maxDistanceKm],
    queryFn: ({ pageParam }) =>
      graphqlFetch<VenuesPage>(GET_CITY_VENUES, {
        cityId,
        limit: VENUES_PAGE_SIZE,
        cursor: pageParam.cursor,
        includeCount: true,
        maxDistanceKm: pageParam.maxDistanceKm,
        ...pageFilterVariables,
      }),
    initialPageParam,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const targetDistance = targetDistanceKm()
      const currentDistance = lastPageParam.maxDistanceKm
      const loadedCount = allPages.reduce(
        (total, page) => total + page.venue.length,
        0,
      )
      const totalWithinTarget = lastPage.venueCount

      if (currentDistance >= targetDistance) {
        if (lastPage.venue.length === 0) return undefined
        if (totalWithinTarget != null && loadedCount >= totalWithinTarget) {
          return undefined
        }
      }

      return {
        cursor: lastLoadedVenueId(allPages),
        maxDistanceKm: Math.max(currentDistance, targetDistance),
      }
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Shared by the venue detail route. The detail page needs to look up a single
 * venue by id, so it still uses the unpaginated list.
 */
export const venuesQueryOptions = {
  queryKey: ['venues'],
  queryFn: () => graphqlFetch<{ venue: venue[] }>(GET_VENUE),
  staleTime: 5 * 60 * 1000,
}
