import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import type { FormEvent } from 'react'

import { CitySearchInput } from '#/components/forms/CitySearchInput'
import { Button } from '#/components/ui/Button'
import { FormField, inputClassName } from '#/components/ui/FormField'
import { graphqlFetch } from '#/graphql/client'
import { UPDATE_VENUE } from '#/graphql/venues'
import { ADMIN_TOKEN } from '#/lib/admin-token'
import { formatOpeningTime } from '#/lib/format-opening-hours'
import { timeToIso } from '#/lib/opening-hours'
import type { City } from '#/types/city'
import type { venue } from '#/types/venue'
import { OpeningHoursEditor } from './OpeningHoursEditor'
import type { OpeningHoursDraft } from './OpeningHoursEditor'

interface UpdateVenueInput {
  id: string
  name: string
  address: string
  cityId: string
  openingHours: {
    days: string[]
    opening: string
    closing: string
  }[]
}

interface UpdateVenueRequest {
  variables: UpdateVenueInput
  token: string | undefined
}

interface EditVenueFormProps {
  venue: venue
  onSaved?: () => void
}

function cityFromVenue(current: venue): City {
  return {
    id: current.city.id,
    name: current.city.name,
    displayName: current.city.displayName ?? null,
    lat: current.city.lat,
    lon: current.city.lon,
  }
}

function openingHoursFromVenue(current: venue): OpeningHoursDraft[] {
  return current.openingHours.map((entry, index) => ({
    key: `venue-${current.id}-opening-hours-${index}`,
    days: entry.days,
    opening: formatOpeningTime(entry.opening),
    closing: formatOpeningTime(entry.closing),
  }))
}

/** Edit form used by the admin venue page. */
export function EditVenueForm({ venue, onSaved }: EditVenueFormProps) {
  const nameId = useId()
  const addressId = useId()
  const errorId = useId()

  const [name, setName] = useState(venue.name)
  const [address, setAddress] = useState(venue.address)
  const [city, setCity] = useState<City | null>(cityFromVenue(venue))
  const [openingHours, setOpeningHours] = useState<OpeningHoursDraft[]>(
    openingHoursFromVenue(venue),
  )
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (input: UpdateVenueRequest) =>
      graphqlFetch<{ updateVenue: { id: string } }>(
        UPDATE_VENUE,
        { input: input.variables },
        input.token,
      ),
    onSuccess: () => {
      setSaved(true)
      setError(null)
      onSaved?.()
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
      void queryClient.invalidateQueries({ queryKey: ['nearbyVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['cityVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['venuePages'] })
      void queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (mutationError) => {
      setSaved(false)
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Could not update the venue. Please try again.',
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isPending) return

    const trimmedName = name.trim()
    const trimmedAddress = address.trim()

    if (!trimmedName) {
      setError('Please enter a venue name.')
      return
    }

    if (!trimmedAddress) {
      setError('Please enter an address.')
      return
    }

    if (city === null) {
      setError('Please search for and select a city.')
      return
    }

    const invalidHours = openingHours.some(
      (entry) => entry.days.length === 0 || !entry.opening || !entry.closing,
    )

    if (invalidHours) {
      setError(
        'Every opening-hours entry needs at least one day and both times.',
      )
      return
    }

    setError(null)
    setSaved(false)
    mutate({
      variables: {
        id: venue.id,
        name: trimmedName,
        address: trimmedAddress,
        cityId: city.id,
        openingHours: openingHours.map((entry) => ({
          days: entry.days,
          opening: timeToIso(entry.opening),
          closing: timeToIso(entry.closing),
        })),
      },
      token: ADMIN_TOKEN,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Venue name" htmlFor={nameId}>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setSaved(false)
            }}
            maxLength={100}
            required
            placeholder="e.g. Den Gode Nabo"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Address" htmlFor={addressId}>
          <input
            id={addressId}
            type="text"
            value={address}
            onChange={(event) => {
              setAddress(event.target.value)
              setSaved(false)
            }}
            maxLength={200}
            required
            placeholder="e.g. Øvre Bakklandet 66, Trondheim"
            className={inputClassName}
          />
        </FormField>
      </div>

      <CitySearchInput
        value={city}
        onChange={(nextCity) => {
          setCity(nextCity)
          setSaved(false)
        }}
        createCityToken={ADMIN_TOKEN}
      />

      <OpeningHoursEditor
        value={openingHours}
        onChange={(nextOpeningHours) => {
          setOpeningHours(nextOpeningHours)
          setSaved(false)
        }}
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-(--sea-ink)"
        >
          {error}
        </p>
      )}

      {saved && !error && (
        <p
          role="status"
          className="rounded-xl bg-(--chip-bg) px-3 py-2 text-sm font-semibold text-(--sea-ink)"
        >
          Venue updated.
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
