import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'

import { makeSearchResult } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import { NearbyVenuesContent } from '../NearbyVenues'

vi.mock('#/lib/use-user-time-zone', () => ({
  useUserTimeZone: () => 'UTC',
}))

type NearbyVenuesContentProps = ComponentProps<typeof NearbyVenuesContent>

function renderNearbyVenues(overrides: Partial<NearbyVenuesContentProps> = {}) {
  return renderWithProviders(
    <NearbyVenuesContent
      venues={[]}
      hasLocation={false}
      locating={false}
      locationError={null}
      isLoading={false}
      isError={false}
      {...overrides}
    />,
  )
}

describe('NearbyVenuesContent', () => {
  it('asks for location access when there is no location', async () => {
    renderNearbyVenues()

    expect(
      await screen.findByText('Allow location access to see pubs near you.'),
    ).toBeInTheDocument()
  })

  it('shows a locating state', async () => {
    renderNearbyVenues({ locating: true })

    expect(
      await screen.findByText('Finding your location…'),
    ).toBeInTheDocument()
  })

  it('shows a location error', async () => {
    renderNearbyVenues({
      locationError: 'Location permission was denied.',
    })

    expect(
      await screen.findByText('Location permission was denied.'),
    ).toBeInTheDocument()
  })

  it('shows an error when nearby venues cannot be loaded', async () => {
    renderNearbyVenues({ hasLocation: true, isError: true })

    expect(
      await screen.findByText('Nearby pubs are unavailable right now.'),
    ).toBeInTheDocument()
  })

  it('shows a loading message while the first results are fetched', async () => {
    renderNearbyVenues({ hasLocation: true, isLoading: true })

    expect(await screen.findByText('Loading nearby pubs…')).toBeInTheDocument()
  })

  it('shows an empty state when no venues are within range', async () => {
    renderNearbyVenues({ hasLocation: true })

    expect(
      await screen.findByText('No pubs within 10 km of your location.'),
    ).toBeInTheDocument()
  })

  it('does not describe a radius when the distance filter is unlimited', async () => {
    renderNearbyVenues({ hasLocation: true, maxDistanceKm: null })

    expect(await screen.findByText('No pubs found.')).toBeInTheDocument()
  })

  it('renders venue rows and links them to their venue pages', async () => {
    const venues = [
      makeSearchResult(),
      makeSearchResult({
        id: 'venue-2',
        name: 'Brewdog',
        address: 'Carl Johans gate 8',
        latestPriceSighting: null,
        averageRating: null,
        reviewCount: 0,
      }),
    ]

    const { user, router } = renderNearbyVenues({
      hasLocation: true,
      venues,
    })

    const list = await screen.findByRole('list')
    const rows = within(list).getAllByRole('listitem')

    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('Studentersamfundet')
    expect(rows[0]).toHaveTextContent('Elgeseter gate 1')
    expect(rows[0]).toHaveTextContent('Weekdays 14:00–02:00')
    expect(rows[0]).toHaveTextContent('NOK 89 · 500 ml')
    expect(rows[0]).toHaveTextContent('4.5')
    expect(rows[0]).toHaveTextContent('(2)')

    const firstLink = within(rows[0]).getByRole('link')

    expect(firstLink).toHaveAttribute('href', '/trondheim/venues/venue-1')

    await user.click(firstLink)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/trondheim/venues/venue-1')
    })
  })

  it('renders venues without a city as plain rows', async () => {
    renderNearbyVenues({
      hasLocation: true,
      venues: [makeSearchResult({ cityId: null })],
    })

    const name = await screen.findByText('Studentersamfundet')

    expect(name.closest('a')).toBeNull()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
