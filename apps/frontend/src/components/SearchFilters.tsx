import { useId, useState } from 'react'
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
  { value: 'CAN', label: 'Can' },
  { value: 'OTHER', label: 'Other' },
]

const fieldClassName =
  'mt-1 w-full rounded-xl bg-(--chip-bg) px-2.5 py-1.5 text-sm text-(--sea-ink) outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)'

const labelClassName = 'block text-xs font-semibold text-(--sea-ink-soft)'

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
  const panelId = useId()
  const [open, setOpen] = useState(false)
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
    <section className="w-full overflow-hidden rounded-2xl border border-(--line) bg-(--surface-strong) text-(--sea-ink) shadow-lg backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
        >
          <span className="text-sm font-bold">
            Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-(--chip-bg) px-1.5 py-0.5 text-xs text-(--sea-ink-soft)">
                {activeCount}
              </span>
            )}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`size-4 shrink-0 text-(--sea-ink-soft) transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_SEARCH_FILTERS)}
            className="shrink-0 rounded-full bg-(--chip-bg) px-2.5 py-1 text-xs font-semibold text-(--sea-ink) transition hover:-translate-y-0.5"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div
          id={panelId}
          className="max-h-[min(60svh,32rem)] overflow-y-auto border-t border-(--line) p-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
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
                      event.target.value === ''
                        ? null
                        : Number(event.target.value),
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
                <p className="mt-1 text-xs text-(--sea-ink-soft)">
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
                onChange={(event) =>
                  updatePrice('minPrice', event.target.value)
                }
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
                onChange={(event) =>
                  updatePrice('maxPrice', event.target.value)
                }
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
                      event.target.value === ''
                        ? null
                        : Number(event.target.value),
                  })
                }
                className={fieldClassName}
              >
                <option value="">Any rating</option>
                {RATING_OPTIONS.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}+ harps
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="sm:col-span-2">
              <legend className={labelClassName}>Serving size</legend>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-2">
                {SIZE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-1.5 text-sm font-medium text-(--sea-ink)"
                  >
                    <input
                      type="checkbox"
                      checked={filters.sizes.includes(option.value)}
                      onChange={() => toggleSize(option.value)}
                      className="h-4 w-4 accent-(--lagoon-deep)"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </section>
  )
}
