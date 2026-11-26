import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CITY_SEARCH } from '#/graphql/cities'
import { graphqlFetch } from '#/graphql/client'
import { GET_CITY_VENUES } from '#/graphql/venues'
import { makeVenue } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import type { City } from '#/types/city'
import { AdminDashboard } from '../../routes/admin/index'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

const TRONDHEIM: City = {
  id: 'trondheim',
  name: 'Trondheim',
  displayName: null,
  lat: 63.4305,
  lon: 10.3951,
}

const BERGEN: City = {
  id: 'bergen',
  name: 'Bergen',
  displayName: null,
  lat: 60.3943,
  lon: 5.3259,
}

const ALPHA = makeVenue({
  id: 'venue-alpha',
  name: 'Alpha Pub',
  city: {
    id: TRONDHEIM.id,
    name: TRONDHEIM.name,
    lat: TRONDHEIM.lat,
    lon: TRONDHEIM.lon,
  },
})
const BETA = makeVenue({
  id: 'venue-beta',
  name: 'Beta Bar',
  city: {
    id: TRONDHEIM.id,
    name: TRONDHEIM.name,
    lat: TRONDHEIM.lat,
    lon: TRONDHEIM.lon,
  },
})
const BERGEN_VENUE = makeVenue({
  id: 'venue-bergen',
  name: 'Bergen Pub',
  city: {
    id: BERGEN.id,
    name: BERGEN.name,
    lat: BERGEN.lat,
    lon: BERGEN.lon,
  },
})

function mockApi() {
  mockGraphqlFetch.mockImplementation(async (query, variables) => {
    if (query === CITY_SEARCH) {
      return { city: [TRONDHEIM, BERGEN] }
    }

    if (query === GET_CITY_VENUES) {
      if (variables?.cityId === BERGEN.id) {
        return { venue: [BERGEN_VENUE], venueCount: 1 }
      }

      if (variables?.cursor === ALPHA.id) {
        return { venue: [BETA], venueCount: 2 }
      }

      return { venue: [ALPHA], venueCount: 2 }
    }

    throw new Error(`Unexpected GraphQL query: ${query}`)
  })
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('loads more venues when the pagination control is used', async () => {
    mockApi()

    const { user } = renderWithProviders(<AdminDashboard />)

    expect(await screen.findByText('Alpha Pub')).toBeInTheDocument()
    expect(screen.getByText('1 of 2 venues loaded')).toBeInTheDocument()
    expect(screen.queryByText('Beta Bar')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Load more venues' }))

    expect(await screen.findByText('Beta Bar')).toBeInTheDocument()
    expect(screen.getByText('2 venues')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Load more venues' }),
    ).not.toBeInTheDocument()
  })

  it('filters the venue list by city', async () => {
    mockApi()

    const { user } = renderWithProviders(<AdminDashboard />)

    expect(await screen.findByText('Alpha Pub')).toBeInTheDocument()

    await user.selectOptions(
      await screen.findByLabelText('Filter by city'),
      BERGEN.id,
    )

    expect(await screen.findByText('Bergen Pub')).toBeInTheDocument()
    expect(screen.queryByText('Alpha Pub')).not.toBeInTheDocument()
    expect(screen.getByText('1 venue')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        GET_CITY_VENUES,
        expect.objectContaining({
          cityId: BERGEN.id,
          cursor: null,
        }),
      )
    })
  })
})
