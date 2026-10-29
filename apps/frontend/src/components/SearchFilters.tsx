import { useId } from 'react'
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react'

import { countActiveFilters, EMPTY_SEARCH_FILTERS } from '../lib/search-filters'
import type { Coordinates } from '../lib/location'
import type {
  GlassSize,
  SearchFilters as SearchFilterValues,
} from '../types/search'

const DISTANCE_OPTIONS_KM = [1, 2, 5, 10, 25]
const RATING_OPTIONS = [3, 3.5, 4, 4.5]

const SIZE_OPTIONS: { value: GlassSize; label: string }[] = [
  { value: 'PINT', label: 'Pint' },
  { value: 'HALF_LITER', label: 'Half litre' },
  { value: 'QUARTER_LITER', label: 'Quarter litre' },
  { value: 'BOX', label: 'Box' },
  { value: 'OTHER', label: 'Other' },
]

const fieldClassName =
  'mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-2.5 py-1.5 text-sm text-[var(--sea-ink)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)'

const labelClassName = 'block text-xs font-semibold text-[var(--sea-ink-soft)]'

function blockNegativeKey(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === '-') {
    event.preventDefault()
  }
}

interface SearchFiltersProps {
  filters: SearchFilterValues
  coordinates: Coordinates | null
  onChange: Dispatch<SetStateAction<SearchFilterValues>>
}

export default function SearchFilters({
  filters,
  coordinates,
  onChange,
}: SearchFiltersProps) {
  const distanceId = useId()
  const activeCount = countActiveFilters(filters, coordinates != null)

  function updateFilters(patch: Partial<SearchFilterValues>) {
    onChange((current) => ({ ...current, ...patch }))
  }

  function updatePrice(field: 'minPrice' | 'maxPrice', value: string) {
    const sanitized =
      value.startsWith('-') || (value !== '' && Number(value) < 0) ? '' : value

    updateFilters(
      field === 'minPrice' ? { minPrice: sanitized } : { maxPrice: sanitized },
    )
  }

  function toggleSize(size: GlassSize) {
    onChange((current) => ({
      ...current,
      sizes: current.sizes.includes(size)
        ? current.sizes.filter((currentSize) => currentSize !== size)
        : [...current.sizes, size],
    }))
  }

  return (
    <section className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-4 text-[var(--sea-ink)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="island-kicker">Filters</p>
          <h2 className="mt-1 text-lg font-extrabold">Filter pubs</h2>
          <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
            Applies to the map, nearby pubs and search results.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(EMPTY_SEARCH_FILTERS)}
          disabled={activeCount === 0}
          className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          Clear filters
          {activeCount > 0 && ` (${activeCount})`}
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor={distanceId} className={labelClassName}>
            Maximum distance
          </label>
          <select
            id={distanceId}
            value={filters.maxDistanceKm ?? ''}
            onChange={(event) =>
              updateFilters({
                maxDistanceKm:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
            disabled={!coordinates}
            className={fieldClassName}
          >
            <option value="">Any distance</option>
            {DISTANCE_OPTIONS_KM.map((distance) => (
              <option key={distance} value={distance}>
                {distance} km
              </option>
            ))}
          </select>
          {!coordinates && (
            <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
              Allow location access to filter by distance.
            </p>
          )}
        </div>

        <label className={labelClassName}>
          Min price (NOK)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Any"
            value={filters.minPrice}
            onKeyDown={blockNegativeKey}
            onChange={(event) => updatePrice('minPrice', event.target.value)}
            className={fieldClassName}
          />
        </label>

        <label className={labelClassName}>
          Max price (NOK)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Any"
            value={filters.maxPrice}
            onKeyDown={blockNegativeKey}
            onChange={(event) => updatePrice('maxPrice', event.target.value)}
            className={fieldClassName}
          />
        </label>

        <label className={labelClassName}>
          Minimum rating
          <select
            value={filters.minRating ?? ''}
            onChange={(event) =>
              updateFilters({
                minRating:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
            className={fieldClassName}
          >
            <option value="">Any rating</option>
            {RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}+ stars
              </option>
            ))}
          </select>
        </label>

        <fieldset className="sm:col-span-2 lg:col-span-4">
          <legend className={labelClassName}>Serving size</legend>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-2">
            {SIZE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--sea-ink)]"
              >
                <input
                  type="checkbox"
                  checked={filters.sizes.includes(option.value)}
                  onChange={() => toggleSize(option.value)}
                  className="h-4 w-4 accent-[var(--lagoon-deep)]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  )
}
