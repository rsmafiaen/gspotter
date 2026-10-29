import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { CREATE_REVIEW } from '#/graphql/venues'
import { makeReview } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import AddReviewDialog from '../AddReviewDialog'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)
const USERNAME_STORAGE_KEY = 'g-spotter:review-username'

async function openDialog() {
  const utils = renderWithProviders(
    <AddReviewDialog venueId="venue-1" venueName="Studentersamfundet" />,
  )
  const { user } = utils

  await user.click(await screen.findByRole('button', { name: 'Add review' }))

  return { ...utils, dialog: screen.getByRole('dialog') }
}

function submitForm(dialog: HTMLElement) {
  const form = dialog.querySelector('form')

  if (!form) throw new Error('The review dialog has no form')

  fireEvent.submit(form)
}

async function fillValidReview(
  user: ReturnType<typeof renderWithProviders>['user'],
) {
  await user.type(screen.getByLabelText('Your name'), 'Kari')
  await user.type(screen.getByLabelText('Your review'), 'Great beer')
  await user.click(screen.getByRole('radio', { name: '4 out of 5 harps' }))
}

describe('AddReviewDialog', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('opens the dialog and restores a previously used name', async () => {
    window.localStorage.setItem(USERNAME_STORAGE_KEY, 'Ola')

    const { dialog } = await openDialog()

    expect(
      screen.getByRole('heading', { name: 'Add a review' }),
    ).toBeInTheDocument()
    expect(dialog).toHaveAttribute('open')
    expect(screen.getByLabelText('Your name')).toHaveValue('Ola')
    expect(
      screen.getByText('Share your thoughts about Studentersamfundet.'),
    ).toBeInTheDocument()
  })

  it('requires a name', async () => {
    const { dialog } = await openDialog()

    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter your name.',
    )
    expect(screen.getByLabelText('Your name')).toHaveFocus()
  })

  it('requires a rating', async () => {
    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Your name'), 'Kari')
    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please choose a rating.',
    )
  })

  it('requires a review body', async () => {
    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Your name'), 'Kari')
    await user.click(screen.getByRole('radio', { name: '4 out of 5 harps' }))
    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please write a short review.',
    )
  })

  it('submits a trimmed review, saves the name and closes the dialog', async () => {
    mockGraphqlFetch.mockResolvedValue({
      createReview: makeReview({
        body: 'Great beer',
        rating: 4,
        username: 'Kari',
      }),
    })

    const { user, dialog, queryClient } = await openDialog()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.type(screen.getByLabelText('Your name'), '  Kari  ')
    await user.type(screen.getByLabelText('Your review'), '  Great beer  ')
    await user.click(screen.getByRole('radio', { name: '4 out of 5 harps' }))

    submitForm(dialog)

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(CREATE_REVIEW, {
        input: {
          venueId: 'venue-1',
          username: 'Kari',
          body: 'Great beer',
          rating: 4,
        },
      })
    })

    expect(window.localStorage.getItem(USERNAME_STORAGE_KEY)).toBe('Kari')

    await waitFor(() => {
      expect(dialog).not.toHaveAttribute('open')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['venues'] })
  })

  it('shows the pending state while the review is being posted', async () => {
    let resolveRequest: (value: {
      createReview: ReturnType<typeof makeReview>
    }) => void = () => {}

    mockGraphqlFetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )

    const { user, dialog } = await openDialog()
    await fillValidReview(user)
    submitForm(dialog)

    expect(
      await screen.findByRole('button', { name: 'Posting…' }),
    ).toBeDisabled()

    resolveRequest({ createReview: makeReview() })

    await waitFor(() => {
      expect(dialog).not.toHaveAttribute('open')
    })
  })

  it('shows an error and keeps the dialog open when posting fails', async () => {
    mockGraphqlFetch.mockRejectedValue(new Error('Request failed'))

    const { user, dialog } = await openDialog()
    await fillValidReview(user)
    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not post your review. Please try again.',
    )
    expect(dialog).toHaveAttribute('open')
    expect(screen.getByRole('button', { name: 'Post review' })).toBeEnabled()
  })

  it('closes the dialog with the close button', async () => {
    const { user, dialog } = await openDialog()

    await user.click(screen.getByRole('button', { name: 'Close dialog' }))

    expect(dialog).not.toHaveAttribute('open')
  })
})
