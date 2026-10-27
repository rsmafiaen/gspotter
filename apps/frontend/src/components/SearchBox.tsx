import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useId, useMemo, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'

import { graphqlFetch } from '../graphql/client'
import { formatPrice } from '../lib/format-price'
import type { SearchResult } from '../types/search'

const DEBOUNCE_MS = 300
const COLLAPSED_RESULT_COUNT = 3

// Search runs in the database (see apps/backend/src/schema/schema.ts). Results
// mix cities and venues; `type` tells them apart.
const SEARCH_QUERY = `
  query Search($term: String!) {
    search(term: $term) {
      type
      name
      lat
      lon
      address
      openingHours {
        days
        opening
        closing
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

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-4 w-4 shrink-0 text-[var(--sea-ink-soft)]"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function SearchBox({
  onSelect,
}: {
  onSelect: (result: SearchResult) => void
}) {
  const inputId = useId()
  const listId = useId()

  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Debounce the term so we do not hit the server on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedTerm(term.trim())
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [term])

  // Collapse the list again whenever the term changes (the plan wants the full
  // list only after the user presses Enter).
  useEffect(() => {
    setShowAll(false)
    setActiveIndex(-1)
  }, [term])

  const { data, isFetching, isError } = useQuery({
    queryKey: ['search', debouncedTerm],
    queryFn: () =>
      graphqlFetch<{ search: SearchResult[] }>(SEARCH_QUERY, {
        term: debouncedTerm,
      }),
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
  const showPanel = open && term.trim().length > 0

  function select(result: SearchResult) {
    setTerm(result.name)
    setDebouncedTerm(result.name)
    setOpen(false)
    setShowAll(false)
    setActiveIndex(-1)
    onSelect(result)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const active = activeIndex >= 0 ? visibleResults[activeIndex] : undefined

    if (active) {
      select(active)
      return
    }

    // Enter (or the search button) reveals the full result list.
    setOpen(true)
    setShowAll(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, visibleResults.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="absolute top-3 right-3 z-[1000] w-[min(22rem,calc(100%_-_1.5rem))]">
      <form role="search" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="sr-only">
          Search for a pub or city
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 shadow-lg backdrop-blur">
          <button
            type="submit"
            aria-label="Search"
            className="shrink-0 rounded-full p-0.5 hover:text-[var(--sea-ink)]"
          >
            <SearchIcon />
          </button>
          <input
            id={inputId}
            type="search"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
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
            className="w-full bg-transparent text-sm text-[var(--sea-ink)] outline-none placeholder:text-[var(--sea-ink-soft)] [&::-webkit-search-cancel-button]:appearance-none"
          />
          {term.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setTerm('')
                setDebouncedTerm('')
                setOpen(false)
                setShowAll(false)
                setActiveIndex(-1)
              }}
              className="shrink-0 rounded-full px-1 text-sm leading-none text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] shadow-lg backdrop-blur">
          {isError && (
            <p className="px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
              Search is unavailable right now.
            </p>
          )}

          {!isError && (waitingForDebounce || isFetching) && (
            <p className="px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
              Searching…
            </p>
          )}

          {!isError &&
            !waitingForDebounce &&
            !isFetching &&
            results.length === 0 && (
              <p className="px-3 py-2 text-sm text-[var(--sea-ink-soft)]">
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
                    className={`w-full px-3 py-2 text-left text-sm text-[var(--sea-ink)] hover:bg-[var(--chip-bg)] ${
                      index === activeOption ? 'bg-[var(--chip-bg)]' : ''
                    }`}
                  >
                    <span className="font-semibold">{result.name}</span>
                    <span className="ml-2 rounded-full border border-[var(--chip-line)] px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide uppercase text-[var(--sea-ink-soft)]">
                      {typeLabel(result)}
                    </span>
                    {result.address && (
                      <span className="mt-0.5 block text-xs text-[var(--sea-ink-soft)]">
                        {result.address}
                      </span>
                    )}
                    {result.latestPriceSighting && (
                      <span className="mt-0.5 block text-xs text-[var(--sea-ink-soft)]">
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
              className="w-full border-t border-[var(--line)] px-3 py-2 text-left text-xs font-semibold text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)]"
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
