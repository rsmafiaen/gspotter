import type { Coordinates } from './location'
import type { GlassSize, SearchFilters } from '../types/search'

export const EMPTY_SEARCH_FILTERS: SearchFilters = {
  maxDistanceKm: null,
  minPrice: '',
  maxPrice: '',
  sizes: [],
  minRating: null,
}

const GLASS_SIZES: readonly GlassSize[] = [
  'PINT',
  'HALF_LITER',
  'QUARTER_LITER',
  'CAN',
  'OTHER',
]

/**
 * The homepage state that is kept in the URL. Filter values are optional so an
 * untouched filter is left out of the query string entirely.
 */
export interface SearchQueryParams {
  /** The text in the pub/city search box. */
  q?: string
  maxDistanceKm?: number
  minPrice?: string
  maxPrice?: string
  sizes?: GlassSize[]
  minRating?: number
}

function isGlassSize(value: unknown): value is GlassSize {
  return (
    typeof value === 'string' &&
    (GLASS_SIZES as readonly string[]).includes(value)
  )
}

function parsePositiveNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined

  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function parsePriceParam(value: unknown): string | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined

  const raw = String(value)

  return parsePrice(raw) == null ? undefined : raw
}

function parseRating(value: unknown): number | undefined {
  const rating = parsePositiveNumber(value)

  return rating != null && rating <= 5 ? rating : undefined
}

/**
 * Normalizes raw query-string values into the shape used by the homepage.
 * Invalid values are dropped so a hand-edited or stale URL never breaks the
 * filter controls.
 */
export function parseSearchQueryParams(
  search: Record<string, unknown>,
): SearchQueryParams {
  const q =
    typeof search.q === 'string' && search.q.length > 0 ? search.q : undefined
  const rawSizes = Array.isArray(search.sizes) ? search.sizes : [search.sizes]
  const sizes = rawSizes.filter(isGlassSize)

  return {
    q,
    maxDistanceKm: parsePositiveNumber(search.maxDistanceKm),
    minPrice: parsePriceParam(search.minPrice),
    maxPrice: parsePriceParam(search.maxPrice),
    sizes: sizes.length > 0 ? sizes : undefined,
    minRating: parseRating(search.minRating),
  }
}

export function searchFiltersFromQueryParams(
  search: SearchQueryParams,
): SearchFilters {
  return {
    maxDistanceKm: search.maxDistanceKm ?? null,
    minPrice: search.minPrice ?? '',
    maxPrice: search.maxPrice ?? '',
    sizes: search.sizes ?? [],
    minRating: search.minRating ?? null,
  }
}

/**
 * Returns only the active filters, which keeps the URL shareable and free of
 * default values.
 */
export function searchFiltersToQueryParams(
  filters: SearchFilters,
): Omit<SearchQueryParams, 'q'> {
  return {
    maxDistanceKm: filters.maxDistanceKm ?? undefined,
    minPrice:
      parsePrice(filters.minPrice) == null ? undefined : filters.minPrice,
    maxPrice:
      parsePrice(filters.maxPrice) == null ? undefined : filters.maxPrice,
    sizes: filters.sizes.length > 0 ? filters.sizes : undefined,
    minRating: filters.minRating ?? undefined,
  }
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
