import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'

import { CitySearchInput } from '#/components/forms/CitySearchInput'
import { Button } from '#/components/ui/Button'
import { Dialog, useDialog } from '#/components/ui/Dialog'
import { FormField, inputClassName } from '#/components/ui/FormField'
import { graphqlFetch } from '#/graphql/client'
import { CREATE_VENUE } from '#/graphql/venues'
import { timeToIso } from '#/lib/opening-hours'
import type { City } from '#/types/city'
import { OpeningHoursEditor } from './OpeningHoursEditor'
import type { OpeningHoursDraft } from './OpeningHoursEditor'

interface CreateVenueInput {
  name: string
  address: string
  cityId: string
  openingHours: {
    days: string[]
    opening: string
    closing: string
  }[]
}

interface CreateVenueRequest {
  variables: CreateVenueInput
  token: string | undefined
}

interface AddVenueDialogProps {
  onCreated?: () => void
}

export function AddVenueDialog({ onCreated }: AddVenueDialogProps) {
  return (
    <Dialog
      trigger={
        <Button variant="primary">
          <span aria-hidden="true">+</span> Add venue
        </Button>
      }
      title="Add a venue"
      size="wide"
    >
      <AddVenueForm onCreated={onCreated} />
    </Dialog>
  )
}

function AddVenueForm({ onCreated }: AddVenueDialogProps) {
  const { open, close } = useDialog()
  const nameId = useId()
  const addressId = useId()
  const errorId = useId()

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState<City | null>(null)
  const [openingHours, setOpeningHours] = useState<OpeningHoursDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (input: CreateVenueRequest) =>
      graphqlFetch<{ createVenue: { id: string } }>(
        CREATE_VENUE,
        { input: input.variables },
        input.token,
      ),
    onSuccess: () => {
      reset()
      close()
      onCreated?.()
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
      void queryClient.invalidateQueries({ queryKey: ['nearbyVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Could not add the venue. Please try again.',
      )
    },
  })

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  function reset() {
    setName('')
    setAddress('')
    setCity(null)
    setOpeningHours([])
    setError(null)
  }

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
    mutate({
      variables: {
        name: trimmedName,
        address: trimmedAddress,
        cityId: city.id,
        openingHours: openingHours.map((entry) => ({
          days: entry.days,
          opening: timeToIso(entry.opening),
          closing: timeToIso(entry.closing),
        })),
      },
      // Token lasts till 2033 for development, would obviously be stored in a cookie and gotten from an auth provider in a production environment
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMWExZmZlZC1hNDY3LTc3MDQtOTM0MS1jM2ZjZjNiMTk5YWMiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MjAwMDAwMDAwMH0.EohmXYCm3GANzUwpGetPEbEP8CRt5oF6Roc-4Y4ZLQk',
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
            onChange={(event) => setName(event.target.value)}
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
            onChange={(event) => setAddress(event.target.value)}
            maxLength={200}
            required
            placeholder="e.g. Øvre Bakklandet 66, Trondheim"
            className={inputClassName}
          />
        </FormField>
      </div>

      <CitySearchInput value={city} onChange={setCity} />

      <OpeningHoursEditor value={openingHours} onChange={setOpeningHours} />

      {error && (
        <p
          id={errorId}
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-(--sea-ink)"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding…' : 'Add venue'}
        </Button>
      </div>
    </form>
  )
}
