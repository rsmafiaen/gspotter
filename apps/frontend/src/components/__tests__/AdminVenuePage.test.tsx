import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { makeVenue } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import { AdminVenuePage } from '../../routes/admin/venues/$venueId'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

describe('AdminVenuePage', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('renders the venue editor and its management sections', async () => {
    mockGraphqlFetch.mockResolvedValue({
      venue: [makeVenue({ name: 'Alpha Pub' })],
    })

    renderWithProviders(<AdminVenuePage />, {
      route: '/admin/venues/venue-1',
    })

    expect(
      await screen.findByRole('heading', { name: 'Alpha Pub' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Save changes' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('table', { name: 'Price sightings' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Manage prices' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('table', { name: 'Delete reviews' }),
    ).toBeInTheDocument()
  })
})
