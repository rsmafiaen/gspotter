import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeVenue } from '#/test/fixtures'
import type { venue } from '#/types/venue'
import { graphqlFetch } from '../client'
import {
  CITY_VENUES_PAGE_SIZE,
  GET_CITY_VENUES,
  cityVenuesQueryOptions,
} from '../venues'
import type { CityVenuesPage } from '../venues'

vi.mock('../client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockedFetch = vi.mocked(graphqlFetch)

function queryFn(
  options: ReturnType<typeof cityVenuesQueryOptions>,
): (context: { pageParam: string | null }) => Promise<CityVenuesPage> {
  return options.queryFn as unknown as (context: {
    pageParam: string | null
  }) => Promise<CityVenuesPage>
}

function nextPageParam(
  options: ReturnType<typeof cityVenuesQueryOptions>,
): (lastPage: { venue: venue[] }) => string | undefined {
  return options.getNextPageParam as unknown as (lastPage: {
    venue: venue[]
  }) => string | undefined
}

function makePage(count: number): CityVenuesPage {
  return {
    venue: Array.from({ length: count }, (_, index) =>
      makeVenue({ id: `venue-${index}`, name: `Venue ${index}` }),
    ),
    venueCount: count,
  }
}

describe('cityVenuesQueryOptions', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('requests the first page without a cursor', async () => {
    const options = cityVenuesQueryOptions('city-1')
    const page = makePage(1)

    mockedFetch.mockResolvedValue(page)

    await expect(queryFn(options)({ pageParam: null })).resolves.toBe(page)
    expect(mockedFetch).toHaveBeenCalledWith(GET_CITY_VENUES, {
      cityId: 'city-1',
      limit: CITY_VENUES_PAGE_SIZE,
      cursor: null,
      includeCount: true,
    })
  })

  it('does not request the total count for later pages', async () => {
    const options = cityVenuesQueryOptions('city-1')
    const page = makePage(1)

    mockedFetch.mockResolvedValue(page)

    await queryFn(options)({ pageParam: 'venue-9' })
    expect(mockedFetch).toHaveBeenCalledWith(GET_CITY_VENUES, {
      cityId: 'city-1',
      limit: CITY_VENUES_PAGE_SIZE,
      cursor: 'venue-9',
      includeCount: false,
    })
  })

  it('uses the last venue id as the cursor when a page is full', () => {
    const options = cityVenuesQueryOptions('city-1')
    const page = makePage(CITY_VENUES_PAGE_SIZE)

    expect(nextPageParam(options)(page)).toBe(
      `venue-${CITY_VENUES_PAGE_SIZE - 1}`,
    )
  })

  it('stops when the final page is not full', () => {
    const options = cityVenuesQueryOptions('city-1')

    expect(nextPageParam(options)(makePage(1))).toBeUndefined()
  })
})
