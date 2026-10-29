import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makePriceSighting, makeReview, makeVenue } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import VenueCard, { venueToSearchResult } from '../VenueCard'

describe('venueToSearchResult', () => {
  it('maps venue data and computes the average rating', () => {
    const result = venueToSearchResult(
      makeVenue({
        reviews: [makeReview({ rating: 4 }), makeReview({ rating: 5 })],
      }),
    )

    expect(result).toMatchObject({
      id: 'venue-1',
      cityId: 'trondheim',
      type: 'venue',
      name: 'Studentersamfundet',
      address: 'Elgeseter gate 1',
      reviewCount: 2,
    })
    expect(result.averageRating).toBe(4.5)
  })

  it('uses no average rating when there are no reviews', () => {
    const result = venueToSearchResult(makeVenue({ reviews: [] }))

    expect(result.averageRating).toBeNull()
    expect(result.reviewCount).toBe(0)
  })

  it('picks the newest price sighting without limitations', () => {
    const result = venueToSearchResult(
      makeVenue({
        pricesSighted: [
          makePriceSighting({
            price: 100,
            timeSighted: '2026-09-01T12:00:00.000Z',
            Limitations: ['Happy hour'],
          }),
          makePriceSighting({
            price: 85,
            timeSighted: '2026-08-01T12:00:00.000Z',
          }),
          makePriceSighting({
            price: 95,
            timeSighted: '2026-10-01T12:00:00.000Z',
          }),
        ],
      }),
    )

    expect(result.latestPriceSighting?.price).toBe(95)
  })
})

describe('VenueCard', () => {
  it('links to the venue and shows its city as the kicker', async () => {
    const { user, router } = renderWithProviders(
      <VenueCard current={makeVenue()} />,
    )

    const link = await screen.findByRole('link')

    expect(link).toHaveAttribute('href', '/trondheim/venues/venue-1')
    expect(
      screen.getByRole('heading', { name: 'Studentersamfundet' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Trondheim')).toBeInTheDocument()

    await user.click(link)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/trondheim/venues/venue-1')
    })
  })
})
