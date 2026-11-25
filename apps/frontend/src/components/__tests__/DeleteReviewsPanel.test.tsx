import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { DELETE_REVIEW } from '#/graphql/reviews'
import { makeReview, makeVenue } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import { DeleteReviewsPanel } from '../admin/DeleteReviewsPanel'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

const ALPHA = makeVenue({
  id: 'venue-alpha',
  name: 'Alpha Pub',
  reviews: [makeReview({ id: 'review-alpha', body: 'Lovely quiet pub.' })],
})

const BETA = makeVenue({
  id: 'venue-beta',
  name: 'Beta Bar',
  reviews: [makeReview({ id: 'review-beta', body: 'Great late-night spot.' })],
})

describe('DeleteReviewsPanel', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('filters reviews by venue', async () => {
    const { user } = renderWithProviders(
      <DeleteReviewsPanel venues={[ALPHA, BETA]} />,
    )

    expect(await screen.findByText('Lovely quiet pub.')).toBeInTheDocument()
    expect(screen.getByText('Great late-night spot.')).toBeInTheDocument()

    await user.selectOptions(
      await screen.findByLabelText('Filter by venue'),
      'venue-beta',
    )

    expect(screen.queryByText('Lovely quiet pub.')).not.toBeInTheDocument()
    expect(screen.getByText('Great late-night spot.')).toBeInTheDocument()
    expect(screen.getByText('1 review')).toBeInTheDocument()
  })

  it('requires confirmation before deleting a review', async () => {
    mockGraphqlFetch.mockResolvedValue({ deleteReview: true })

    const { user, queryClient } = renderWithProviders(
      <DeleteReviewsPanel venues={[ALPHA, BETA]} />,
    )
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.selectOptions(
      await screen.findByLabelText('Filter by venue'),
      'venue-beta',
    )
    await user.click(await screen.findByRole('button', { name: 'Delete' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Delete review?')
    expect(dialog).toHaveTextContent('will be permanently deleted')
    expect(mockGraphqlFetch).not.toHaveBeenCalled()

    await user.click(
      within(dialog).getByRole('button', { name: 'Delete review' }),
    )

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        DELETE_REVIEW,
        { id: 'review-beta' },
        expect.any(String),
      )
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['venues'] })
  })

  it('shows an empty state when there are no reviews', async () => {
    renderWithProviders(<DeleteReviewsPanel venues={[]} />)

    expect(
      await screen.findByText('There are no reviews to delete.'),
    ).toBeInTheDocument()
  })
})
