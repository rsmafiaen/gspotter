import { describe, expect, it } from 'vitest'

import {
  EMPTY_SEARCH_FILTERS,
  parseSearchQueryParams,
  searchFiltersFromQueryParams,
  searchFiltersToQueryParams,
} from '../search-filters'
import type { SearchFilters } from '../../types/search'

describe('search query params', () => {
  it('normalizes valid values and drops invalid ones', () => {
    expect(
      parseSearchQueryParams({
        q: 'brew',
        maxDistanceKm: '5',
        minPrice: '50',
        maxPrice: 'not-a-price',
        sizes: ['PINT', 'BOGUS', 'CAN'],
        minRating: 4.5,
      }),
    ).toEqual({
      q: 'brew',
      maxDistanceKm: 5,
      minPrice: '50',
      maxPrice: undefined,
      sizes: ['PINT', 'CAN'],
      minRating: 4.5,
    })
  })

  it('treats missing and empty filters as the defaults', () => {
    expect(searchFiltersFromQueryParams(parseSearchQueryParams({}))).toEqual(
      EMPTY_SEARCH_FILTERS,
    )
  })

  it('round-trips active filters through the URL', () => {
    const filters: SearchFilters = {
      maxDistanceKm: 10,
      minPrice: '60',
      maxPrice: '120',
      sizes: ['HALF_LITER'],
      minRating: 4,
    }
    const params = searchFiltersToQueryParams(filters)

    expect(
      searchFiltersFromQueryParams(
        parseSearchQueryParams(params as Record<string, unknown>),
      ),
    ).toEqual(filters)
  })

  it('omits inactive filters from the URL', () => {
    expect(searchFiltersToQueryParams(EMPTY_SEARCH_FILTERS)).toEqual({
      maxDistanceKm: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sizes: undefined,
      minRating: undefined,
    })
  })
})
