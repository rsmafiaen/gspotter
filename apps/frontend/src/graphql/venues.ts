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

/**
 * Shared by the city and venue routes. Both render from the same list, so the
 * options live here to keep the cache key and staleness in sync; the route
 * loaders prefetch it during SSR so the first paint already has the content.
 */
export const venuesQueryOptions = {
  queryKey: ['venues'],
  queryFn: () => graphqlFetch<{ venue: venue[] }>(GET_VENUE),
  staleTime: 5 * 60 * 1000,
}
