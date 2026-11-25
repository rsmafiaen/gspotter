import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useState } from 'react'
import { HarpIcon } from '#/components/HarpIcon'
import type { FormEvent, KeyboardEvent } from 'react'

import { graphqlFetch } from '../graphql/client'
import { formatPrice } from '../lib/format-price'
import { searchFilterVariables } from '../lib/search-filters'
import { useDebounce } from '../lib/use-debounce'
import type { Coordinates } from '../lib/location'
import type { SearchFilters, SearchResult } from '../types/search'

const DEBOUNCE_MS = 300
const COLLAPSED_RESULT_COUNT = 3

// Every filter is sent to the backend, which filters the data in Postgres.
// Results mix cities and venues; `type` tells them apart.
const SEARCH_QUERY = `
  query Search(
    $term: String!
    $lat: Float
    $lon: Float
    $maxDistanceKm: Float
    $minPrice: Float
    $maxPrice: Float
    $sizes: [GlassSize!]
    $minRating: Float
  ) {
    search(
      term: $term
      lat: $lat
      lon: $lon
      maxDistanceKm: $maxDistanceKm
      minPrice: $minPrice
      maxPrice: $maxPrice
      sizes: $sizes
      minRating: $minRating
    ) {
      id
      cityId
      type
      name
      lat
      lon
      distanceKm
      address
      openingHours {
        days
        opening
        closing
      }
      openingHoursNotes {
        days
        note
      }
      latestPriceSighting {
        price
        size
        sizeMl
        Limitations
        timeStart
        timeEnd
        timeSighted
      }
      averageRating
      reviewCount
    }
  }
`

function typeRank(result: SearchResult) {
  // Cities are the most useful thing to jump to, so list them first.
  return result.type === 'city' ? 0 : 1
}

function typeLabel(result: SearchResult) {
  return result.type === 'city' ? 'City' : 'Pub'
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`

  return `${distanceKm.toFixed(1)} km`
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-4 shrink-0 text-(--sea-ink-soft)"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

interface SearchBoxProps {
  /** The user's position, used to calculate and filter by distance. */
  coordinates?: Coordinates | null
  filters: SearchFilters
  /** Route whose `q` search parameter stores the search term. */
  from?: '/' | '/$cityId/venues/'
}

export function SearchBox({
  coordinates = null,
  filters,
  from = '/',
}: SearchBoxProps) {
  const navigate = useNavigate({ from })
  const searchTerm = useSearch({ from, select: (search) => search.q })
  const inputId = useId()
  const listId = useId()

  const term = searchTerm ?? ''
  // The URL is the source of truth for the term, but the request should only
  // run after the user pauses typing.
  const debouncedTerm = useDebounce(term.trim(), DEBOUNCE_MS)
  const [showAll, setShowAll] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  function updateTerm(next: string) {
    void navigate({
      search: (previous) => ({ ...previous, q: next || undefined }),
      replace: true,
    })
  }

  // Collapse the list again whenever the term or filters change (the plan wants
  // the full list only after the user presses Enter).
  useEffect(() => {
    setShowAll(false)
    setActiveIndex(-1)
  }, [term, filters])

  const variables = useMemo(
    () => ({
      term: debouncedTerm,
      ...searchFilterVariables(filters, coordinates),
    }),
    [debouncedTerm, coordinates, filters],
  )

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search', variables],
    queryFn: () =>
      graphqlFetch<{ search: SearchResult[] }>(SEARCH_QUERY, variables),
    enabled: debouncedTerm.length > 0,
    placeholderData: keepPreviousData,
    retry: 1,
  })

  const results = useMemo(() => {
    const all = data?.search ?? []

    return [...all].sort((a, b) => typeRank(a) - typeRank(b))
  }, [data])

  const visibleResults = showAll
    ? results
    : results.slice(0, COLLAPSED_RESULT_COUNT)
  const hiddenCount = results.length - visibleResults.length
  const activeOption =
    activeIndex >= 0 && activeIndex < visibleResults.length ? activeIndex : -1

  const waitingForDebounce = term.trim() !== debouncedTerm
  // Keep results visible whenever the bar has text, including after loading a
  // shared URL, instead of only while the input is focused.
  const showPanel = term.trim().length > 0

  function select(result: SearchResult) {
    updateTerm(result.name)
    setShowAll(false)
    setActiveIndex(-1)

    if (result.type === 'city') {
      void navigate({
        to: '/$cityId/venues',
        params: { cityId: result.id },
      })
    } else if (result.cityId) {
      void navigate({
        to: '/$cityId/venues/$venueId',
        params: { cityId: result.cityId, venueId: result.id },
      })
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const active = activeIndex >= 0 ? visibleResults[activeIndex] : undefined

    if (active) {
      select(active)
      return
    }

    // Enter (or the search button) reveals the full result list.
    setShowAll(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, visibleResults.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Escape') {
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative z-1000 w-full">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="rounded-xl bg-(--chip-bg) backdrop-blur"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="submit"
            aria-label="Search"
            className="shrink-0 rounded-full p-0.5 hover:text-(--sea-ink)"
          >
            <SearchIcon />
          </button>
          <label htmlFor={inputId} className="sr-only">
            Search for a pub or city
          </label>
          <input
            id={inputId}
            type="search"
            value={term}
            onChange={(event) => {
              updateTerm(event.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search for a pub or city…"
            autoComplete="off"
            role="combobox"
            aria-controls={listId}
            aria-expanded={showPanel}
            aria-autocomplete="list"
            aria-activedescendant={
              activeOption >= 0 ? `${listId}-option-${activeOption}` : undefined
            }
            className="w-full bg-transparent text-sm text-(--sea-ink) outline-none placeholder:text-(--sea-ink-soft) [&::-webkit-search-cancel-button]:appearance-none"
          />
          {term.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                updateTerm('')
                setShowAll(false)
                setActiveIndex(-1)
              }}
              className="shrink-0 rounded-full px-1 text-sm leading-none text-(--sea-ink-soft) hover:text-(--sea-ink)"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div className="absolute top-full right-0 left-0 mt-2 overflow-hidden rounded-xl bg-(--surface-strong) shadow-lg backdrop-blur">
          {isError && (
            <p className="px-3 py-2 text-sm text-(--sea-ink-soft)">
              Search is unavailable right now.
            </p>
          )}

          {!isError && (waitingForDebounce || isFetching) && (
            <p className="px-3 py-2 text-sm text-(--sea-ink-soft)">
              Searching…
            </p>
          )}

          {!isError &&
            !waitingForDebounce &&
            !isFetching &&
            results.length === 0 && (
              <p className="px-3 py-2 text-sm text-(--sea-ink-soft)">
                No matches for “{debouncedTerm}”.
              </p>
            )}

          {!isError && visibleResults.length > 0 && (
            <ul id={listId} role="listbox" className="max-h-80 overflow-y-auto">
              {visibleResults.map((result, index) => (
                <li
                  key={`${result.type}-${result.name}-${index}`}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeOption}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`w-full px-3 py-2 text-left text-sm text-(--sea-ink) hover:bg-(--chip-bg) ${
                      index === activeOption ? 'bg-(--chip-bg)' : ''
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0">
                        <span className="font-semibold">{result.name}</span>
                        <span className="ml-2 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase text-(--sea-ink-soft)">
                          {typeLabel(result)}
                        </span>
                      </span>
                      {result.averageRating != null && (
                        <span
                          title={`Average rating ${result.averageRating.toFixed(1)} out of 5 from ${
                            result.reviewCount ?? 0
                          } ${
                            (result.reviewCount ?? 0) === 1
                              ? 'review'
                              : 'reviews'
                          }`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-(--chip-bg) px-1.5 py-0.5 text-xs font-bold"
                        >
                          <HarpIcon />
                          <span>{result.averageRating.toFixed(1)}</span>
                          <span className="font-normal text-(--sea-ink-soft)">
                            ({result.reviewCount ?? 0})
                          </span>
                        </span>
                      )}
                    </span>
                    {(result.address || result.distanceKm != null) && (
                      <span className="mt-0.5 flex items-baseline justify-between gap-2 text-xs text-(--sea-ink-soft)">
                        {result.address && (
                          <span className="min-w-0">{result.address}</span>
                        )}
                        {result.distanceKm != null && (
                          <span className="ml-auto shrink-0 text-right">
                            {formatDistance(result.distanceKm)} away
                          </span>
                        )}
                      </span>
                    )}
                    {result.latestPriceSighting && (
                      <span className="mt-0.5 block text-xs text-(--sea-ink-soft)">
                        {formatPrice(result.latestPriceSighting)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isError && hiddenCount > 0 && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowAll(true)}
              className="w-full border-t border-(--line) px-3 py-2 text-left text-xs font-semibold text-(--sea-ink-soft) hover:bg-(--chip-bg)"
            >
              Show all {results.length} results (or press Enter)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBox
