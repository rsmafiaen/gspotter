import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_SEARCH_FILTERS } from '#/lib/search-filters'
import { makeVenue } from '#/test/fixtures'
import { graphqlFetch } from '../client'
import {
  GET_CITY_VENUES,
  INITIAL_DISTANCE_KM,
  VENUES_PAGE_SIZE,
  distanceVenuesQueryOptions,
} from '../venues'
import type { VenuePageParams, VenuesPage } from '../venues'

vi.mock('../client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockedFetch = vi.mocked(graphqlFetch)

function queryFn(
  options: ReturnType<typeof distanceVenuesQueryOptions>,
): (context: { pageParam: VenuePageParams }) => Promise<VenuesPage> {
  return options.queryFn as unknown as (context: {
    pageParam: VenuePageParams
  }) => Promise<VenuesPage>
}

function nextPageParam(
  options: ReturnType<typeof distanceVenuesQueryOptions>,
): (
  lastPage: VenuesPage,
  allPages: VenuesPage[],
  lastPageParam: VenuePageParams,
) => VenuePageParams | undefined {
  return options.getNextPageParam as unknown as (
    lastPage: VenuesPage,
    allPages: VenuesPage[],
    lastPageParam: VenuePageParams,
  ) => VenuePageParams | undefined
}

function makePage(count: number, total = count): VenuesPage {
  return {
    venue: Array.from({ length: count }, (_, index) =>
      makeVenue({ id: `venue-${index}`, name: `Venue ${index}` }),
    ),
    venueCount: total,
  }
}

describe('distanceVenuesQueryOptions', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('requests the first distance page without a cursor', async () => {
    const options = distanceVenuesQueryOptions('city-1')
    const page = makePage(1)

    mockedFetch.mockResolvedValue(page)

    await expect(
      queryFn(options)({
        pageParam: options.initialPageParam,
      }),
    ).resolves.toBe(page)
    expect(mockedFetch).toHaveBeenCalledWith(GET_CITY_VENUES, {
      cityId: 'city-1',
      limit: VENUES_PAGE_SIZE,
      cursor: null,
      includeCount: true,
      maxDistanceKm: INITIAL_DISTANCE_KM,
    })
  })

  it('requests later pages after the previous cursor', async () => {
    const options = distanceVenuesQueryOptions('city-1')
    const page = makePage(1)

    mockedFetch.mockResolvedValue(page)

    await queryFn(options)({
      pageParam: { cursor: 'venue-9', maxDistanceKm: 10 },
    })
    expect(mockedFetch).toHaveBeenCalledWith(GET_CITY_VENUES, {
      cityId: 'city-1',
      limit: VENUES_PAGE_SIZE,
      cursor: 'venue-9',
      includeCount: true,
      maxDistanceKm: 10,
    })
  })

  it('passes active filters and coordinates to the API', async () => {
    const options = distanceVenuesQueryOptions(
      'city-1',
      {
        maxDistanceKm: 5,
        minPrice: '50',
        maxPrice: '',
        sizes: ['PINT'],
        minRating: 4,
      },
      { lat: 63.43, lon: 10.39 },
    )
    const page = makePage(1)

    mockedFetch.mockResolvedValue(page)

    await queryFn(options)({
      pageParam: options.initialPageParam,
    })

    expect(mockedFetch).toHaveBeenCalledWith(GET_CITY_VENUES, {
      cityId: 'city-1',
      limit: VENUES_PAGE_SIZE,
      cursor: null,
      includeCount: true,
      maxDistanceKm: INITIAL_DISTANCE_KM,
      lat: 63.43,
      lon: 10.39,
      minPrice: 50,
      sizes: ['PINT'],
      minRating: 4,
    })
  })

  it('moves to the requested distance target using the last venue cursor', () => {
    const options = distanceVenuesQueryOptions(
      'city-1',
      EMPTY_SEARCH_FILTERS,
      { lat: 63.43, lon: 10.39 },
      true,
      () => 5,
    )
    const page = makePage(VENUES_PAGE_SIZE)

    expect(
      nextPageParam(options)(page, [page], {
        cursor: null,
        maxDistanceKm: INITIAL_DISTANCE_KM,
      }),
    ).toEqual({
      cursor: `venue-${VENUES_PAGE_SIZE - 1}`,
      maxDistanceKm: 5,
    })
  })

  it('stops at the configured maximum radius after a short page', () => {
    const options = distanceVenuesQueryOptions(
      'city-1',
      { ...EMPTY_SEARCH_FILTERS, maxDistanceKm: INITIAL_DISTANCE_KM },
      { lat: 63.43, lon: 10.39 },
    )
    const page = makePage(1)

    expect(
      nextPageParam(options)(page, [page], {
        cursor: 'venue-0',
        maxDistanceKm: INITIAL_DISTANCE_KM,
      }),
    ).toBeUndefined()
  })

  it('continues within the maximum radius while pages are full', () => {
    const options = distanceVenuesQueryOptions(
      'city-1',
      { ...EMPTY_SEARCH_FILTERS, maxDistanceKm: INITIAL_DISTANCE_KM },
      { lat: 63.43, lon: 10.39 },
    )
    const page = makePage(VENUES_PAGE_SIZE, VENUES_PAGE_SIZE * 2)

    expect(
      nextPageParam(options)(page, [page], {
        cursor: null,
        maxDistanceKm: INITIAL_DISTANCE_KM,
      }),
    ).toEqual({
      cursor: `venue-${VENUES_PAGE_SIZE - 1}`,
      maxDistanceKm: INITIAL_DISTANCE_KM,
    })
  })
})
