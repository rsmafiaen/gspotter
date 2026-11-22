import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useId, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { FormField, inputClassName } from '#/components/ui/FormField'
import {
  CITY_PLACE_SEARCH,
  CITY_SEARCH,
  FIND_OR_CREATE_CITY,
} from '#/graphql/cities'
import { graphqlFetch } from '#/graphql/client'
import type { City, CityPlace } from '#/types/city'

const DEBOUNCE_MS = 1000
const MIN_EXTERNAL_SEARCH_LENGTH = 2

interface CitySearchInputProps {
  value: City | null
  onChange: (city: City | null) => void
  label?: string
  /** Admin token used to save cities found outside the local database. */
  createCityToken?: string
}

type CitySuggestion =
  | { key: string; name: string; displayName?: string | null; city: City }
  | { key: string; name: string; displayName: string; place: CityPlace }

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latDelta = toRadians(bLat - aLat)
  const lonDelta = toRadians(bLon - aLon)
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(aLat)) *
      Math.cos(toRadians(bLat)) *
      Math.sin(lonDelta / 2) ** 2

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isKnownCity(place: CityPlace, cities: City[]) {
  const placeName = place.name.toLocaleLowerCase('nb-NO')
  const placeDisplayName = place.displayName.toLocaleLowerCase('nb-NO')

  return cities.some((city) => {
    if (city.name.toLocaleLowerCase('nb-NO') !== placeName) return false

    if (
      city.displayName &&
      city.displayName.toLocaleLowerCase('nb-NO') === placeDisplayName
    ) {
      return true
    }

    return distanceKm(place.lat, place.lon, city.lat, city.lon) <= 25
  })
}

export function CitySearchInput({
  value,
  onChange,
  label = 'City',
  createCityToken,
}: CitySearchInputProps) {
  const inputId = useId()
  const listId = useId()

  const [term, setTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [cityError, setCityError] = useState<string | null>(null)

  const queryClient = useQueryClient()

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
    setCityError(null)
  }, [value])

  const {
    data: dbData,
    isFetching: isDbFetching,
    isError: isDbError,
    isPlaceholderData: isDbPlaceholderData,
  } = useQuery({
    queryKey: ['citySearch', debouncedTerm],
    queryFn: () =>
      graphqlFetch<{ city: City[] }>(CITY_SEARCH, { name: debouncedTerm }),
    enabled: value === null && debouncedTerm.length > 0,
    placeholderData: keepPreviousData,
    retry: 1,
  })

  const dbCities = isDbPlaceholderData ? [] : (dbData?.city ?? [])
  const waitingForDebounce = term.trim() !== debouncedTerm

  // The local results and the Nominatim results are combined, so both known
  // cities and new places are visible in the same list.
  const shouldSearchPlaces =
    value === null &&
    debouncedTerm.length >= MIN_EXTERNAL_SEARCH_LENGTH &&
    !waitingForDebounce

  const {
    data: placesData,
    isFetching: isPlacesFetching,
    isPending: isPlacesPending,
    isError: isPlacesError,
  } = useQuery({
    queryKey: ['cityPlaces', debouncedTerm],
    queryFn: () =>
      graphqlFetch<{ cityPlaceSearch: CityPlace[] }>(CITY_PLACE_SEARCH, {
        name: debouncedTerm,
      }),
    enabled: shouldSearchPlaces,
    retry: 1,
  })

  const { mutateAsync: createCity, isPending: isCreatingCity } = useMutation({
    mutationFn: (place: CityPlace) =>
      graphqlFetch<{ findOrCreateCity: City }>(
        FIND_OR_CREATE_CITY,
        {
          input: {
            name: place.name,
            displayName: place.displayName,
            lat: place.lat,
            lon: place.lon,
          },
        },
        createCityToken,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['search'] })
    },
  })

  const places = shouldSearchPlaces ? (placesData?.cityPlaceSearch ?? []) : []
  const newPlaces = places.filter((place) => !isKnownCity(place, dbCities))
  const searchingPlaces =
    shouldSearchPlaces && (isPlacesFetching || isPlacesPending)
  const isSearching = waitingForDebounce || isDbFetching || searchingPlaces

  const suggestions: CitySuggestion[] = [
    ...dbCities.map((city) => ({
      key: city.id,
      name: city.name,
      displayName: city.displayName,
      city,
    })),
    ...newPlaces.map((place, index) => ({
      key: `place-${index}-${place.lat}-${place.lon}`,
      name: place.name,
      displayName: place.displayName,
      place,
    })),
  ]

  const hasSuggestions = suggestions.length > 0
  const searchFailed =
    !hasSuggestions && (isDbError || (shouldSearchPlaces && isPlacesError))

  const activeSuggestion =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? suggestions[activeIndex]
      : undefined

  function select(city: City) {
    onChange(city)
    setTerm(city.name)
    setOpen(false)
    setActiveIndex(-1)
    setCityError(null)
  }

  async function selectPlace(place: CityPlace) {
    if (isCreatingCity) return

    setCityError(null)

    try {
      const { findOrCreateCity } = await createCity(place)
      select(findOrCreateCity)
    } catch (error) {
      setCityError(
        error instanceof Error
          ? error.message
          : 'Could not add the city. Please try again.',
      )
    }
  }

  function choose(suggestion: CitySuggestion) {
    if (isCreatingCity) return

    if ('city' in suggestion) {
      select(suggestion.city)
      return
    }

    void selectPlace(suggestion.place)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Enter') {
      const suggestion = activeSuggestion ?? suggestions.at(0)

      if (suggestion) {
        event.preventDefault()
        choose(suggestion)
      }
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
          <span>
            <span className="block font-semibold">{value.name}</span>
            {value.displayName && value.displayName !== value.name && (
              <span className="block text-xs text-(--sea-ink-soft)">
                {value.displayName}
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setTerm('')
              setDebouncedTerm('')
              setCityError(null)
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
      hint="Search for a city and click a result or press Enter. Cities outside the list are added automatically."
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
            setCityError(null)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Trondheim or Paris"
          autoComplete="off"
          role="combobox"
          aria-controls={listId}
          aria-expanded={open && term.trim().length > 0}
          aria-autocomplete="list"
          aria-busy={isCreatingCity}
          aria-activedescendant={
            activeSuggestion ? `${listId}-option-${activeIndex}` : undefined
          }
          className={inputClassName}
        />

        {open && term.trim().length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute top-full right-0 left-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-xl bg-(--surface-strong) p-1 shadow-lg"
          >
            {searchFailed && (
              <li className="px-2 py-1.5 text-sm text-(--sea-ink-soft)">
                City search is unavailable right now.
              </li>
            )}

            {!searchFailed &&
              !hasSuggestions &&
              (isSearching || isCreatingCity) && (
                <li className="px-2 py-1.5 text-sm text-(--sea-ink-soft)">
                  {isCreatingCity ? 'Adding city…' : 'Searching…'}
                </li>
              )}

            {!searchFailed &&
              !isSearching &&
              !isCreatingCity &&
              !hasSuggestions && (
                <li className="px-2 py-1.5 text-sm text-(--sea-ink-soft)">
                  No cities match “{debouncedTerm}”.
                </li>
              )}

            {!searchFailed &&
              suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.key}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                    disabled={isCreatingCity}
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-sm text-(--sea-ink) hover:bg-(--chip-bg) disabled:opacity-60 ${
                      activeIndex === index ? 'bg-(--chip-bg)' : ''
                    }`}
                  >
                    <span className="block">{suggestion.name}</span>
                    {suggestion.displayName &&
                      suggestion.displayName !== suggestion.name && (
                        <span className="block text-xs text-(--sea-ink-soft)">
                          {suggestion.displayName}
                        </span>
                      )}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      {cityError && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-(--sea-ink)"
        >
          {cityError}
        </p>
      )}
    </FormField>
  )
}
