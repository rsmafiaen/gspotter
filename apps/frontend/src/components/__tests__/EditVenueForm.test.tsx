import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { UPDATE_VENUE } from '#/graphql/venues'
import { makeVenue } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import { EditVenueForm } from '../admin/EditVenueForm'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

const VENUE = makeVenue({
  name: 'Old Pub',
  address: 'Old Street 1',
  openingHours: [
    {
      days: ['MON'],
      opening: '2000-01-01T15:00:00.000Z',
      closing: '2000-01-01T22:00:00.000Z',
    },
  ],
  reviews: [],
  pricesSighted: [],
})

describe('EditVenueForm', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('prefills the venue and saves the updated information', async () => {
    mockGraphqlFetch.mockResolvedValue({ updateVenue: { id: 'venue-1' } })

    const { user, queryClient } = renderWithProviders(
      <EditVenueForm venue={VENUE} />,
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    expect(await screen.findByLabelText('Venue name')).toHaveValue('Old Pub')
    expect(await screen.findByLabelText('Address')).toHaveValue('Old Street 1')

    await user.clear(await screen.findByLabelText('Venue name'))
    await user.type(screen.getByLabelText('Venue name'), 'Updated Pub')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        UPDATE_VENUE,
        {
          input: {
            id: 'venue-1',
            name: 'Updated Pub',
            address: 'Old Street 1',
            cityId: 'trondheim',
            openingHours: [
              {
                days: ['MON'],
                opening: '2000-01-01T15:00:00.000Z',
                closing: '2000-01-01T22:00:00.000Z',
              },
            ],
          },
        },
        expect.any(String),
      )
    })

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Venue updated.',
    )
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['venues'] })
  })

  it('requires a venue name', async () => {
    const { user } = renderWithProviders(<EditVenueForm venue={VENUE} />)

    await user.clear(await screen.findByLabelText('Venue name'))

    const form = screen
      .getByRole('button', { name: 'Save changes' })
      .closest('form')

    if (!form) throw new Error('The venue form was not found')

    fireEvent.submit(form)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter a venue name.',
    )
    expect(mockGraphqlFetch).not.toHaveBeenCalled()
  })
})
