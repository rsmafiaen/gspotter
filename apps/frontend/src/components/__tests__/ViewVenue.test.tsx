import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeOpeningHours, makeSearchResult } from '#/test/fixtures'
import { ViewVenue } from '../ViewVenue'

describe('ViewVenue', () => {
  it('renders the venue details, rating, price and opening hours', () => {
    render(<ViewVenue venue={makeSearchResult()} kicker="Trondheim" />)

    expect(screen.getByText('Trondheim')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Studentersamfundet' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Elgeseter gate 1')).toBeInTheDocument()
    expect(screen.getByText('NOK 89 · 500 ml')).toBeInTheDocument()
    expect(
      screen.getByTitle('Average rating 4.5 out of 5 from 2 reviews'),
    ).toBeInTheDocument()
    expect(screen.getByText('Weekdays')).toBeInTheDocument()
    expect(screen.getByText('14:00 - 02:00')).toBeInTheDocument()
  })

  it('uses a singular review label for a single review', () => {
    render(
      <ViewVenue
        venue={makeSearchResult({ averageRating: 5, reviewCount: 1 })}
      />,
    )

    expect(
      screen.getByTitle('Average rating 5.0 out of 5 from 1 review'),
    ).toBeInTheDocument()
  })

  it('renders every opening-hours entry in order', () => {
    render(
      <ViewVenue
        venue={makeSearchResult({
          openingHours: [
            makeOpeningHours({
              days: ['SAT', 'SUN'],
              opening: '2026-10-01T12:00:00.000Z',
              closing: '2026-10-02T03:00:00.000Z',
            }),
            makeOpeningHours(),
          ],
        })}
      />,
    )

    const items = screen.getAllByRole('listitem')

    expect(items[0]).toHaveTextContent('Weekends')
    expect(items[0]).toHaveTextContent('12:00 - 03:00')
    expect(items[1]).toHaveTextContent('Weekdays')
    expect(items[1]).toHaveTextContent('14:00 - 02:00')
  })

  it('copes with missing ratings, prices and opening hours', () => {
    render(
      <ViewVenue
        venue={makeSearchResult({
          averageRating: null,
          reviewCount: 0,
          latestPriceSighting: null,
          openingHours: [],
        })}
      />,
    )

    expect(screen.queryByTitle(/Average rating/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Latest price:/)).not.toBeInTheDocument()
    expect(screen.getByText('No opening hours listed.')).toBeInTheDocument()
  })

  it('formats a price sighting without a millilitre size', () => {
    render(
      <ViewVenue
        venue={makeSearchResult({
          latestPriceSighting: {
            ...makeSearchResult().latestPriceSighting!,
            size: 'HALF_LITRE',
            sizeMl: null,
          },
        })}
      />,
    )

    expect(screen.getByText('NOK 89 · half litre')).toBeInTheDocument()
  })
})
