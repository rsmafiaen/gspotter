import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { graphqlFetch } from '#/graphql/client'
import { makeSearchResult } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import SearchBox from '../SearchBox'
import { EMPTY_SEARCH_FILTERS } from '#/lib/search-filters'

vi.mock('#/graphql/client', () => ({
  graphqlFetch: vi.fn(),
}))

const mockGraphqlFetch = vi.mocked(graphqlFetch)

const city = makeSearchResult({
  id: 'trondheim',
  cityId: null,
  type: 'city',
  name: 'Trondheim',
  address: null,
  openingHours: null,
  latestPriceSighting: null,
  averageRating: null,
  reviewCount: 0,
})

function mockSearchResults(results: ReturnType<typeof makeSearchResult>[]) {
  mockGraphqlFetch.mockResolvedValue({ search: results })
}

async function renderSearchBox(route = '/') {
  const utils = renderWithProviders(
    <SearchBox filters={EMPTY_SEARCH_FILTERS} />,
    { route },
  )
  const input = await screen.findByRole('combobox', {
    name: 'Search for a pub or city',
  })

  return { ...utils, input }
}

async function search(
  user: ReturnType<typeof renderWithProviders>['user'],
  input: HTMLElement,
  term: string,
) {
  await user.type(input, term)

  await waitFor(
    () => {
      expect(mockGraphqlFetch).toHaveBeenCalled()
    },
    { timeout: 2000 },
  )
}

describe('SearchBox', () => {
  beforeEach(() => {
    mockGraphqlFetch.mockReset()
  })

  it('debounces typing before querying the API', async () => {
    mockSearchResults([city])

    const { user, input, router } = await renderSearchBox()

    await user.type(input, 'tro')

    expect(mockGraphqlFetch).not.toHaveBeenCalled()
    expect(screen.getByText('Searching…')).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ q: 'tro' })

    await waitFor(
      () => {
        expect(mockGraphqlFetch).toHaveBeenCalledTimes(1)
      },
      { timeout: 2000 },
    )

    expect(mockGraphqlFetch).toHaveBeenCalledWith(
      expect.stringContaining('query Search'),
      {
        term: 'tro',
      },
    )
  })

  it('restores and shows results for a term from the URL', async () => {
    mockSearchResults([city])

    const { input } = await renderSearchBox('/?q=tro')

    expect(input).toHaveValue('tro')
    expect(input).not.toHaveFocus()

    expect(await screen.findByRole('option')).toHaveTextContent('Trondheim')

    await waitFor(
      () => {
        expect(mockGraphqlFetch).toHaveBeenCalledWith(
          expect.stringContaining('query Search'),
          { term: 'tro' },
        )
      },
      { timeout: 2000 },
    )
  })

  it('keeps results visible after the search bar loses focus', async () => {
    mockSearchResults([city])

    const { user, input } = await renderSearchBox()

    await user.type(input, 'tro')
    await screen.findByRole('option')

    await user.tab()

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('lists cities before venues and shows result details', async () => {
    mockSearchResults([
      makeSearchResult({ id: 'venue-1', name: 'Brewdog' }),
      city,
    ])

    const { user, input } = await renderSearchBox()
    await search(user, input, 'tro')

    const options = await screen.findAllByRole('option')

    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('Trondheim')
    expect(options[0]).toHaveTextContent('City')
    expect(options[1]).toHaveTextContent('Brewdog')
    expect(options[1]).toHaveTextContent('Pub')
    expect(options[1]).toHaveTextContent('Elgeseter gate 1')
    expect(options[1]).toHaveTextContent('NOK 89 · 500 ml')
  })

  it('keeps the distance on the address row with or without a price', async () => {
    mockSearchResults([
      makeSearchResult({
        id: 'with-price',
        name: 'With price',
        distanceKm: 1.2,
      }),
      makeSearchResult({
        id: 'without-price',
        name: 'Without price',
        latestPriceSighting: null,
        distanceKm: 2.5,
      }),
    ])

    const { user, input } = await renderSearchBox()
    await search(user, input, 'tr')

    const options = await screen.findAllByRole('option')

    for (const option of options) {
      const address = within(option).getByText('Elgeseter gate 1')
      const distance = within(option).getByText(/km away$/)

      expect(distance).toHaveClass('ml-auto')
      expect(distance.parentElement).toBe(address.parentElement)
    }
  })

  it('collapses long result lists and reveals them on request', async () => {
    mockSearchResults([
      city,
      makeSearchResult({ id: 'venue-1', name: 'Brewdog' }),
      makeSearchResult({ id: 'venue-2', name: 'Habitat' }),
      makeSearchResult({ id: 'venue-3', name: 'Lille London' }),
    ])

    const { user, input } = await renderSearchBox()
    await search(user, input, 'tr')

    expect(await screen.findAllByRole('option')).toHaveLength(3)

    await user.click(
      screen.getByRole('button', {
        name: 'Show all 4 results (or press Enter)',
      }),
    )

    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('reveals every result when Enter is pressed', async () => {
    mockSearchResults([
      city,
      makeSearchResult({ id: 'venue-1', name: 'Brewdog' }),
      makeSearchResult({ id: 'venue-2', name: 'Habitat' }),
      makeSearchResult({ id: 'venue-3', name: 'Lille London' }),
    ])

    const { user, input } = await renderSearchBox()
    await search(user, input, 'tr')

    expect(await screen.findAllByRole('option')).toHaveLength(3)

    await user.keyboard('{Enter}')

    expect(screen.getAllByRole('option')).toHaveLength(4)
  })

  it('navigates to a city venue list when a city is selected', async () => {
    mockSearchResults([city])

    const { user, input, router } = await renderSearchBox()
    await search(user, input, 'tro')

    const option = await screen.findByRole('option')
    await user.click(within(option).getByRole('button'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/trondheim/venues')
    })
  })

  it('navigates to a venue page when a venue is selected', async () => {
    mockSearchResults([makeSearchResult({ id: 'venue-1', name: 'Brewdog' })])

    const { user, input, router } = await renderSearchBox()
    await search(user, input, 'brew')

    const option = await screen.findByRole('option')
    await user.click(within(option).getByRole('button'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/trondheim/venues/venue-1')
    })
  })

  it('supports keyboard navigation and selection', async () => {
    mockSearchResults([
      city,
      makeSearchResult({ id: 'venue-1', name: 'Brewdog' }),
    ])

    const { user, input, router } = await renderSearchBox()
    await search(user, input, 'tr')

    await screen.findAllByRole('option')

    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/trondheim/venues/venue-1')
    })
  })

  it('shows an empty state when there are no matches', async () => {
    mockSearchResults([])

    const { user, input } = await renderSearchBox()
    await search(user, input, 'zzz')

    expect(await screen.findByText('No matches for “zzz”.')).toBeInTheDocument()
  })

  it('shows an error state when the search request fails', async () => {
    mockGraphqlFetch.mockRejectedValue(new Error('Network error'))

    const { user, input } = await renderSearchBox()
    await search(user, input, 'tro')

    expect(
      await screen.findByText('Search is unavailable right now.', undefined, {
        timeout: 4000,
      }),
    ).toBeInTheDocument()
  })

  it('clears the search and closes the result panel', async () => {
    mockSearchResults([city])

    const { user, input } = await renderSearchBox()
    await search(user, input, 'tro')
    await screen.findByRole('option')

    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(input).toHaveValue('')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
