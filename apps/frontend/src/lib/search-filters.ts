import type { Coordinates } from './location'
import type { SearchFilters } from '../types/search'

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  maxDistanceKm: null,
  minPrice: '',
  maxPrice: '',
  sizes: [],
  minRating: null,
}

export function parsePrice(value: string): number | null {
  if (value.trim() === '') return null

  const price = Number(value)

  return Number.isFinite(price) && price >= 0 ? price : null
}

/** Builds the GraphQL variables shared by search and nearby-venue queries. */
export function searchFilterVariables(
  filters: SearchFilters,
  coordinates: Coordinates | null,
) {
  const values: Record<string, unknown> = {}
  const minPrice = parsePrice(filters.minPrice)
  const maxPrice = parsePrice(filters.maxPrice)

  if (coordinates) {
    values.lat = coordinates.lat
    values.lon = coordinates.lon
  }

  if (coordinates && filters.maxDistanceKm != null) {
    values.maxDistanceKm = filters.maxDistanceKm
  }

  if (minPrice != null) values.minPrice = minPrice
  if (maxPrice != null) values.maxPrice = maxPrice
  if (filters.sizes.length > 0) values.sizes = filters.sizes
  if (filters.minRating != null) values.minRating = filters.minRating

  return values
}

export function countActiveFilters(
  filters: SearchFilters,
  hasLocation: boolean,
) {
  const minPrice = parsePrice(filters.minPrice)
  const maxPrice = parsePrice(filters.maxPrice)

  return (
    (hasLocation && filters.maxDistanceKm != null ? 1 : 0) +
    (minPrice != null || maxPrice != null ? 1 : 0) +
    (filters.sizes.length > 0 ? 1 : 0) +
    (filters.minRating != null ? 1 : 0)
  )
}
