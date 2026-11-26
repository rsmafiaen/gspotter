import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { DELETE_VENUE } from '#/graphql/venues'
import { makeReview, makeVenue } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import { VenueTable } from '../admin/VenueTable'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

describe('VenueTable', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('lists venue details, coordinates, hours, price and review count', async () => {
    renderWithProviders(
      <VenueTable
        venues={[
          makeVenue({
            reviews: [makeReview({ id: 'review-1' })],
          }),
        ]}
      />,
    )

    const table = await screen.findByRole('table')

    expect(
      within(table).getByRole('link', { name: 'Studentersamfundet' }),
    ).toBeInTheDocument()
    expect(
      within(table).getByRole('link', { name: 'Studentersamfundet' }),
    ).toHaveAttribute('href', '/admin/venues/venue-1')
    expect(within(table).getByText('Trondheim')).toBeInTheDocument()
    expect(within(table).getByText('Elgeseter gate 1')).toBeInTheDocument()
    expect(within(table).getByText('63.42280, 10.39570')).toBeInTheDocument()
    expect(within(table).getByText(/Weekdays/)).toBeInTheDocument()
    expect(
      within(table).getAllByText('NOK 89 · 500 ml').length,
    ).toBeGreaterThan(0)
    expect(within(table).getByText('1')).toBeInTheDocument()
  })

  it('deletes a venue after confirmation', async () => {
    mockGraphqlFetch.mockResolvedValue({ deleteVenue: true })

    const { user, queryClient } = renderWithProviders(
      <VenueTable venues={[makeVenue()]} />,
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Delete venue?')
    expect(dialog).toHaveTextContent(
      'all of its opening hours, price sightings and reviews',
    )
    expect(mockGraphqlFetch).not.toHaveBeenCalled()

    await user.click(
      within(dialog).getByRole('button', { name: 'Delete venue' }),
    )

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        DELETE_VENUE,
        { id: 'venue-1' },
        expect.any(String),
      )
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['venues'] })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('cancels venue deletion without sending a request', async () => {
    const { user } = renderWithProviders(<VenueTable venues={[makeVenue()]} />)

    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(mockGraphqlFetch).not.toHaveBeenCalled()
  })

  it('shows an empty state when there are no venues', async () => {
    renderWithProviders(<VenueTable venues={[]} />)

    expect(
      await screen.findByText('No venues have been added yet.'),
    ).toBeInTheDocument()
  })
})
