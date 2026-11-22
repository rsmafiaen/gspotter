import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useId, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { FormField, inputClassName } from '#/components/ui/FormField'
import { CITY_SEARCH } from '#/graphql/cities'
import { graphqlFetch } from '#/graphql/client'
import type { City } from '#/types/city'

const DEBOUNCE_MS = 300

interface CitySearchInputProps {
  value: City | null
  onChange: (city: City | null) => void
  label?: string
}

export function CitySearchInput({
  value,
  onChange,
  label = 'City',
}: CitySearchInputProps) {
  const inputId = useId()
  const listId = useId()

  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedTerm(term.trim()), DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [term])

  useEffect(() => {
    if (value) {
      setTerm(value.name)
      setOpen(false)
    } else {
      setTerm('')
    }
  }, [value])

  const { data, isFetching, isError } = useQuery({
    queryKey: ['citySearch', debouncedTerm],
    queryFn: () =>
      graphqlFetch<{ city: City[] }>(CITY_SEARCH, { name: debouncedTerm }),
    enabled: value === null && debouncedTerm.length > 0,
    placeholderData: keepPreviousData,
    retry: 1,
  })

  const cities = data?.city ?? []
  const waitingForDebounce = term.trim() !== debouncedTerm
  const activeCity =
    activeIndex >= 0 && activeIndex < cities.length
      ? cities[activeIndex]
      : undefined

  function select(city: City) {
    onChange(city)
    setTerm(city.name)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, cities.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Enter' && activeCity) {
      event.preventDefault()
      select(activeCity)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  if (value) {
    return (
      <div className="grid gap-1.5">
        <span className="text-sm font-bold">{label}</span>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-(--chip-bg) px-3 py-2 text-sm">
          <span className="font-semibold">{value.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setTerm('')
              setDebouncedTerm('')
            }}
            className="rounded-lg px-2 py-0.5 text-xs font-bold text-(--sea-ink-soft) hover:bg-(--link-bg-hover) hover:text-(--sea-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      hint="Search for a city and click the result."
    >
      <div className="relative">
        <input
          id={inputId}
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Trondheim"
          autoComplete="off"
          role="combobox"
          aria-controls={listId}
          aria-expanded={open && term.trim().length > 0}
          aria-autocomplete="list"
          aria-activedescendant={
            activeCity ? `${listId}-${activeCity.id}` : undefined
          }
          className={inputClassName}
        />

        {open && term.trim().length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-xl bg-(--surface-strong) p-1 shadow-lg"
          >
            {isError && (
              <li className="px-2 py-1.5 text-sm text-(--sea-ink-soft)">
                City search is unavailable right now.
              </li>
            )}

            {!isError && (waitingForDebounce || isFetching) && (
              <li className="px-2 py-1.5 text-sm text-(--sea-ink-soft)">
                Searching…
              </li>
            )}

            {!isError &&
              !waitingForDebounce &&
              !isFetching &&
              cities.length === 0 && (
                <li className="px-2 py-1.5 text-sm text-(--sea-ink-soft)">
                  No cities match “{debouncedTerm}”.
                </li>
              )}

            {!isError &&
              cities.map((city) => (
                <li
                  key={city.id}
                  id={`${listId}-${city.id}`}
                  role="option"
                  aria-selected={activeCity?.id === city.id}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(city)}
                    onMouseEnter={() =>
                      setActiveIndex(
                        cities.findIndex(
                          (candidate) => candidate.id === city.id,
                        ),
                      )
                    }
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-sm text-(--sea-ink) hover:bg-(--chip-bg) ${
                      activeCity?.id === city.id ? 'bg-(--chip-bg)' : ''
                    }`}
                  >
                    {city.name}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </FormField>
  )
}
