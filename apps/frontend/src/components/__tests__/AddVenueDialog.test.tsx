import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CITY_PLACE_SEARCH,
  CITY_SEARCH,
  FIND_OR_CREATE_CITY,
} from '#/graphql/cities'
import { graphqlFetch } from '#/graphql/client'
import { CREATE_VENUE } from '#/graphql/venues'
import { renderWithProviders } from '#/test/render'
import type { City, CityPlace } from '#/types/city'
import { AddVenueDialog } from '../admin/AddVenueDialog'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

const CITY: City = {
  id: 'city-1',
  name: 'Trondheim',
  displayName: null,
  lat: 63.4305,
  lon: 10.3951,
}

interface MockApiOptions {
  cities?: City[]
  places?: CityPlace[]
  createdCity?: City
}

function mockApi({
  cities = [],
  places = [],
  createdCity,
}: MockApiOptions = {}) {
  mockGraphqlFetch.mockImplementation(async (query) => {
    if (query === CITY_SEARCH) {
      return { city: cities }
    }

    if (query === CITY_PLACE_SEARCH) {
      return { cityPlaceSearch: places }
    }

    if (query === FIND_OR_CREATE_CITY) {
      if (!createdCity) {
        throw new Error('findOrCreateCity was not expected')
      }

      return { findOrCreateCity: createdCity }
    }

    if (query === CREATE_VENUE) {
      return { createVenue: { id: 'venue-new' } }
    }

    throw new Error(`Unexpected GraphQL query: ${query}`)
  })
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

  it('selects the first city result when Enter is pressed', async () => {
    mockApi({ cities: [CITY] })

    const { user } = await openDialog()

    await user.type(screen.getByLabelText('City'), 'Tro')
    await screen.findByRole('button', { name: 'Trondheim' })
    await user.keyboard('{Enter}')

    expect(
      await screen.findByRole('button', { name: 'Change' }),
    ).toBeInTheDocument()
  })

  it('requires every opening-hours entry to have days and times', async () => {
    mockApi({ cities: [CITY] })

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
    mockApi({ cities: [CITY] })

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

  it('does not duplicate database cities in the Nominatim results', async () => {
    mockApi({
      cities: [CITY],
      places: [
        {
          name: 'Trondheim',
          displayName: 'Trondheim, Trøndelag, Norge',
          lat: 63.4305,
          lon: 10.3951,
        },
      ],
    })

    const { user } = await openDialog()

    await user.type(screen.getByLabelText('City'), 'Tro')

    await screen.findByRole('button', { name: 'Trondheim' })
    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(CITY_PLACE_SEARCH, {
        name: 'Tro',
      })
    })

    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('merges database and Nominatim results, keeping database cities first', async () => {
    const place = {
      name: 'Bergen',
      displayName: 'Bergen, Vestland, Norge',
      lat: 60.3943055,
      lon: 5.3259192,
    }
    const createdCity = {
      id: 'city-bergen',
      name: 'Bergen',
      displayName: place.displayName,
      lat: place.lat,
      lon: place.lon,
    }

    mockApi({ cities: [CITY], places: [place], createdCity })

    const { user, dialog } = await openDialog()

    await user.type(screen.getByLabelText('Venue name'), 'Bryggen Pub')
    await user.type(screen.getByLabelText('Address'), 'Bryggen 1')
    await user.type(screen.getByLabelText('City'), 'Bergen')

    const externalOption = await screen.findByRole('button', {
      name: /Bergen, Vestland, Norge/,
    })
    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveTextContent('Trondheim')
    expect(options[1]).toHaveTextContent('Bergen')

    await user.click(externalOption)

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(CITY_PLACE_SEARCH, {
        name: 'Bergen',
      })
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        FIND_OR_CREATE_CITY,
        {
          input: {
            name: place.name,
            displayName: place.displayName,
            lat: place.lat,
            lon: place.lon,
          },
        },
        expect.any(String),
      )
    })

    expect(
      await screen.findByRole('button', { name: 'Change' }),
    ).toBeInTheDocument()

    submitForm(dialog)

    await waitFor(() => {
      expect(mockGraphqlFetch).toHaveBeenCalledWith(
        CREATE_VENUE,
        {
          input: {
            name: 'Bryggen Pub',
            address: 'Bryggen 1',
            cityId: createdCity.id,
            openingHours: [],
          },
        },
        expect.any(String),
      )
    })
  })
})
