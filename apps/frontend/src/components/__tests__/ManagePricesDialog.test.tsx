import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { DELETE_PRICE_SIGHTING } from '#/graphql/price-sightings'
import { makeVenue, makeVenuePriceSighting } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import { ManagePricesDialog } from '../admin/ManagePricesDialog'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

vi.mock('#/lib/use-user-time-zone', () => ({
  useUserTimeZone: () => 'UTC',
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

const VENUE = makeVenue({
  pricesSighted: [
    makeVenuePriceSighting({
      id: 'price-1',
      price: 89,
      timeSighted: '2026-10-01T12:00:00.000Z',
    }),
    makeVenuePriceSighting({
      id: 'price-2',
      price: 99,
      timeSighted: '2026-09-01T12:00:00.000Z',
    }),
  ],
})

describe('ManagePricesDialog', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('lists price sightings and deletes a confirmed sighting', async () => {
    mockGraphqlFetch.mockResolvedValue({ deletePriceSighting: true })

    const { user, queryClient } = renderWithProviders(
      <ManagePricesDialog venue={VENUE} />,
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.click(
      await screen.findByRole('button', { name: 'Manage prices' }),
    )

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Manage price sightings')
    expect(within(dialog).getByText('NOK 89 · 500 ml')).toBeInTheDocument()
    expect(within(dialog).getByText('NOK 99 · 500 ml')).toBeInTheDocument()

    const sighting = within(dialog).getByText('NOK 89 · 500 ml').closest('li')

    if (!sighting) throw new Error('Price sighting row was not found')

    await user.click(within(sighting).getByRole('button', { name: 'Delete' }))

    const confirmation = await screen.findByRole('dialog', {
      name: 'Delete price sighting?',
    })
    await user.click(
      within(confirmation).getByRole('button', { name: 'Delete price' }),
    )

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        DELETE_PRICE_SIGHTING,
        { id: 'price-1' },
        expect.any(String),
      )
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['venues'] })
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Delete price sighting?' }),
      ).not.toBeInTheDocument()
    })
  })

  it('shows an empty state when the venue has no price sightings', async () => {
    const { user } = renderWithProviders(
      <ManagePricesDialog venue={makeVenue({ pricesSighted: [] })} />,
    )

    await user.click(
      await screen.findByRole('button', { name: 'Manage prices' }),
    )

    expect(
      await screen.findByText(
        'No price sightings have been reported for this venue.',
      ),
    ).toBeInTheDocument()
  })
})
