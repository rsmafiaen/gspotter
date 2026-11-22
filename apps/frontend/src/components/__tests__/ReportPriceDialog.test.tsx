import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { CREATE_PRICE_SIGHTING } from '#/graphql/price-sightings'
import { renderWithProviders } from '#/test/render'
import { ReportPriceDialog } from '../prices/ReportPriceDialog'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

async function openDialog() {
  const utils = renderWithProviders(
    <ReportPriceDialog venueId="venue-1" venueName="Studentersamfundet" />,
  )

  await utils.user.click(
    await screen.findByRole('button', { name: 'Report price' }),
  )

  return { ...utils, dialog: await screen.findByRole('dialog') }
}

function submitForm(dialog: HTMLElement) {
  const form = dialog.querySelector('form')

  if (!form) throw new Error('The price dialog has no form')

  fireEvent.submit(form)
}

describe('ReportPriceDialog', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('opens the dialog and shows the venue name', async () => {
    const { dialog } = await openDialog()

    expect(dialog).toHaveAttribute('open')
    expect(
      screen.getByRole('heading', { name: 'Report a price' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Seen a price at Studentersamfundet? Let other guests know.',
      ),
    ).toBeInTheDocument()
  })

  it('requires a price greater than 0', async () => {
    const { dialog } = await openDialog()

    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter a price greater than 0.',
    )
  })

  it('requires both times when the price is time-limited', async () => {
    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Price (NOK)'), '99')
    await user.click(screen.getByLabelText('Only during a time window'))
    await user.clear(screen.getByLabelText('Starts'))

    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please choose both a start and end time.',
    )
  })

  it('only shows the millilitre field for the Other serving size', async () => {
    const { user } = await openDialog()

    expect(
      screen.queryByLabelText('Size in millilitres'),
    ).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Serving size'), 'OTHER')
    expect(screen.getByLabelText('Size in millilitres')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Serving size'), 'PINT')
    expect(
      screen.queryByLabelText('Size in millilitres'),
    ).not.toBeInTheDocument()
  })

  it('requires millilitres when the serving size is Other', async () => {
    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Price (NOK)'), '99')
    await user.selectOptions(screen.getByLabelText('Serving size'), 'OTHER')
    submitForm(dialog)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter the serving size in millilitres.',
    )
  })

  it('submits a price sighting and closes the dialog', async () => {
    mockGraphqlFetch.mockResolvedValue({
      createPriceSighting: { id: 'sighting-1' },
    })

    const { user, dialog, queryClient } = await openDialog()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await user.type(screen.getByLabelText('Price (NOK)'), '99')
    await user.selectOptions(screen.getByLabelText('Serving size'), 'OTHER')
    await user.type(screen.getByLabelText('Size in millilitres'), '568')
    await user.click(screen.getByLabelText('Member price'))
    await user.click(
      within(dialog).getByRole('button', { name: 'Report price' }),
    )

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(CREATE_PRICE_SIGHTING, {
        input: {
          venueId: 'venue-1',
          price: 99,
          size: 'OTHER',
          sizeMl: 568,
          limitation: ['MEMBERSHIP'],
          timeStart: undefined,
          timeEnd: undefined,
        },
      })
    })

    await waitFor(() => {
      expect(dialog).not.toHaveAttribute('open')
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['venues'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['nearbyVenues'],
    })
  })

  it('converts a happy-hour window to ISO timestamps', async () => {
    mockGraphqlFetch.mockResolvedValue({
      createPriceSighting: { id: 'sighting-1' },
    })

    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Price (NOK)'), '79')
    await user.click(screen.getByLabelText('Only during a time window'))
    await user.click(
      within(dialog).getByRole('button', { name: 'Report price' }),
    )

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        CREATE_PRICE_SIGHTING,
        expect.objectContaining({
          input: expect.objectContaining({
            limitation: ['TIME'],
            timeStart: '2000-01-01T15:00:00.000Z',
            timeEnd: '2000-01-01T17:00:00.000Z',
          }),
        }),
      )
    })
  })
})
