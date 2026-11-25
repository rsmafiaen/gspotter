import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { ManagePricesDialog } from '#/components/admin/ManagePricesDialog'
import { Button } from '#/components/ui/Button'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { graphqlFetch } from '#/graphql/client'
import { DELETE_VENUE } from '#/graphql/venues'
import { ADMIN_TOKEN } from '#/lib/admin-token'
import { formatOpeningHours } from '#/lib/format-opening-hours'
import { formatPrice } from '#/lib/format-price'
import type { venue } from '#/types/venue'

function latestRegularPrice(current: venue) {
  return (
    current.pricesSighted
      ?.filter((sighting) => sighting.Limitations.length === 0)
      .sort((a, b) => b.timeSighted.localeCompare(a.timeSighted))
      .at(0) ?? null
  )
}

export function VenueTable({ venues }: { venues: venue[] }) {
  const [venueToDelete, setVenueToDelete] = useState<venue | null>(null)
  const queryClient = useQueryClient()

  const { mutate, reset, isPending, isError, error } = useMutation({
    mutationFn: (id: string) =>
      graphqlFetch<{ deleteVenue: boolean }>(DELETE_VENUE, { id }, ADMIN_TOKEN),
    onSuccess: () => {
      setVenueToDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
      void queryClient.invalidateQueries({ queryKey: ['nearbyVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['cityVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['search'] })
    },
  })

  function openConfirmation(current: venue) {
    reset()
    setVenueToDelete(current)
  }

  function closeConfirmation() {
    if (isPending) return

    reset()
    setVenueToDelete(null)
  }

  function confirmDelete() {
    if (venueToDelete !== null) mutate(venueToDelete.id)
  }

  if (venues.length === 0) {
    return (
      <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm text-(--sea-ink-soft)">
        No venues have been added yet.
      </p>
    )
  }

  const errorMessage = isError
    ? `Could not delete the venue${error instanceof Error ? `: ${error.message}` : '.'}`
    : null

  return (
    <>
      <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl bg-(--surface-strong) text-(--sea-ink)">
        <table
          aria-label="Venues"
          className="striped-table w-full min-w-max border-collapse text-left text-sm"
        >
          <thead className="bg-(--chip-bg)">
            <tr className="text-xs font-bold tracking-wide uppercase text-(--sea-ink-soft)">
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Actions
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Venue
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                City
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Address
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Coordinates
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Opening hours
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Latest price
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Reviews
              </th>
            </tr>
          </thead>
          <tbody>
            {venues.map((current) => {
              const latestPrice = latestRegularPrice(current)

              return (
                <tr key={current.id} className="transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ManagePricesDialog venue={current} />
                      <Button
                        variant="danger"
                        onClick={() => openConfirmation(current)}
                        className="px-2.5 py-1.5 text-xs whitespace-nowrap"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                  <th
                    scope="row"
                    className="px-4 py-3 font-bold whitespace-nowrap"
                  >
                    <Link
                      to="/$cityId/venues/$venueId"
                      params={{
                        cityId: current.city.id,
                        venueId: current.id,
                      }}
                      className="text-(--lagoon-deep) hover:underline"
                    >
                      {current.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {current.city.name}
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft) whitespace-nowrap">
                    {current.address}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-(--sea-ink-soft)">
                    {current.lat.toFixed(5)}, {current.lon.toFixed(5)}
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft) whitespace-nowrap">
                    {current.openingHours.length > 0
                      ? formatOpeningHours(current.openingHours)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft) whitespace-nowrap">
                    {latestPrice ? formatPrice(latestPrice) : '—'}
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft) whitespace-nowrap">
                    {current.reviews.length}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {venueToDelete && (
        <ConfirmDialog
          open
          title="Delete venue?"
          description={
            <>
              <strong>“{venueToDelete.name}”</strong> and all of its opening
              hours, price sightings and reviews will be permanently deleted.
              This cannot be undone.
            </>
          }
          confirmLabel="Delete venue"
          pendingLabel="Deleting…"
          pending={isPending}
          error={errorMessage}
          onConfirm={confirmDelete}
          onClose={closeConfirmation}
        />
      )}
    </>
  )
}
