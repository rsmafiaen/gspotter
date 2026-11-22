import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeReview, makeVenue } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import { VenueTable } from '../admin/VenueTable'

describe('VenueTable', () => {
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
    expect(within(table).getByText('Trondheim')).toBeInTheDocument()
    expect(within(table).getByText('Elgeseter gate 1')).toBeInTheDocument()
    expect(within(table).getByText('63.42280, 10.39570')).toBeInTheDocument()
    expect(within(table).getByText(/Weekdays/)).toBeInTheDocument()
    expect(within(table).getByText('NOK 89 · 500 ml')).toBeInTheDocument()
    expect(within(table).getByText('1')).toBeInTheDocument()
  })

  it('shows an empty state when there are no venues', async () => {
    renderWithProviders(<VenueTable venues={[]} />)

    expect(
      await screen.findByText('No venues have been added yet.'),
    ).toBeInTheDocument()
  })
})
