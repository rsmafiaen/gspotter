import { infiniteQueryOptions } from '@tanstack/react-query'

import type { venue } from '#/types/venue'
import { graphqlFetch } from './client'

export const CREATE_REVIEW = `
  mutation CreateReview($input: MutationCreateReviewInput!) {
    createReview(input: $input) {
      id
      username
      body
      rating
      timeCreated
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

export const CITY_VENUES_PAGE_SIZE = 10

export const GET_CITY_VENUES = `
  query CityVenues(
    $cityId: String!
    $limit: Int!
    $cursor: String
    $includeCount: Boolean!
  ) {
    venue(cityId: $cityId, limit: $limit, cursor: $cursor) {
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
    venueCount(cityId: $cityId) @include(if: $includeCount)
  }
`

export interface CityVenuesPage {
  venue: venue[]
  venueCount?: number
}

/**
 * Infinite, cursor-paginated venues for a single city. The backend returns
 * venues sorted by name and uses the last venue id as the next cursor. The
 * total count is only requested for the first page.
 */
export const cityVenuesQueryOptions = (cityId: string) =>
  infiniteQueryOptions({
    queryKey: ['cityVenues', cityId],
    queryFn: ({ pageParam }) =>
      graphqlFetch<CityVenuesPage>(GET_CITY_VENUES, {
        cityId,
        limit: CITY_VENUES_PAGE_SIZE,
        cursor: pageParam,
        includeCount: pageParam === null,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => {
      const lastVenue = lastPage.venue.at(-1)

      if (!lastVenue || lastPage.venue.length < CITY_VENUES_PAGE_SIZE) {
        return undefined
      }

      return lastVenue.id
    },
    staleTime: 5 * 60 * 1000,
  })

/**
 * Shared by the venue detail route. The detail page needs to look up a single
 * venue by id, so it still uses the unpaginated list.
 */
export const venuesQueryOptions = {
  queryKey: ['venues'],
  queryFn: () => graphqlFetch<{ venue: venue[] }>(GET_VENUE),
  staleTime: 5 * 60 * 1000,
}
