import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CITY_SEARCH } from '#/graphql/cities'
import { graphqlFetch } from '#/graphql/client'
import { CREATE_VENUE } from '#/graphql/venues'
import { renderWithProviders } from '#/test/render'
import { AddVenueDialog } from '../admin/AddVenueDialog'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

const CITY = {
  id: 'city-1',
  name: 'Trondheim',
  lat: 63.4305,
  lon: 10.3951,
}

async function openDialog() {
  const utils = renderWithProviders(<AddVenueDialog />)

  await utils.user.click(
    await screen.findByRole('button', { name: 'Add venue' }),
  )

  return { ...utils, dialog: await screen.findByRole('dialog') }
}

async function selectCity(
  user: ReturnType<typeof renderWithProviders>['user'],
) {
  await user.type(screen.getByLabelText('City'), 'Tro')

  await user.click(await screen.findByRole('button', { name: 'Trondheim' }))
}

function submitForm(dialog: HTMLElement) {
  const form = dialog.querySelector('form')

  if (!form) throw new Error('The venue dialog has no form')

  fireEvent.submit(form)
}

describe('AddVenueDialog', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('opens the dialog', async () => {
    const { dialog } = await openDialog()

    expect(dialog).toHaveAttribute('open')
    expect(
      screen.getByRole('heading', { name: 'Add a venue' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Venue name')).toBeInTheDocument()
    expect(screen.getByLabelText('Address')).toBeInTheDocument()
  })

  it('requires a venue name', async () => {
    const { dialog } = await openDialog()

    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter a venue name.',
    )
  })

  it('requires a city selected from the search results', async () => {
    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Venue name'), 'Den Gode Nabo')
    await user.type(
      screen.getByLabelText('Address'),
      'Øvre Bakklandet 66, Trondheim',
    )
    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please search for and select a city.',
    )
  })

  it('requires every opening-hours entry to have days and times', async () => {
    mockGraphqlFetch.mockResolvedValueOnce({ city: [CITY] })

    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Venue name'), 'Den Gode Nabo')
    await user.type(
      screen.getByLabelText('Address'),
      'Øvre Bakklandet 66, Trondheim',
    )
    await selectCity(user)
    await user.click(
      screen.getByRole('button', { name: '+ Add opening hours' }),
    )
    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Every opening-hours entry needs at least one day and both times.',
    )
  })

  it('searches for a city and submits the venue with opening hours', async () => {
    mockGraphqlFetch.mockResolvedValueOnce({ city: [CITY] })
    mockGraphqlFetch.mockResolvedValueOnce({
      createVenue: { id: 'venue-new' },
    })
    mockGraphqlFetch.mockResolvedValue({ city: [CITY] })

    const { user, dialog, queryClient } = await openDialog()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.type(screen.getByLabelText('Venue name'), 'Den Gode Nabo')
    await user.type(screen.getByLabelText('Address'), 'Øvre Bakklandet 66')
    await selectCity(user)

    await user.click(
      screen.getByRole('button', { name: '+ Add opening hours' }),
    )
    await user.click(screen.getByRole('checkbox', { name: /Monday/ }))

    await user.click(within(dialog).getByRole('button', { name: 'Add venue' }))

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(CITY_SEARCH, {
        name: 'Tro',
      })
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        CREATE_VENUE,
        {
          input: {
            name: 'Den Gode Nabo',
            address: 'Øvre Bakklandet 66',
            cityId: 'city-1',
            openingHours: [
              {
                days: ['MON'],
                opening: '2000-01-01T11:00:00.000Z',
                closing: '2000-01-01T22:00:00.000Z',
              },
            ],
          },
        },
        expect.any(String),
      )
    })

    await waitFor(() => {
      expect(dialog).not.toHaveAttribute('open')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['venues'] })
  })
})
