import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '#/components/ui/Button'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { graphqlFetch } from '#/graphql/client'
import { DELETE_PRICE_SIGHTING } from '#/graphql/price-sightings'
import { ADMIN_TOKEN } from '#/lib/admin-token'
import { formatPrice, formatPriceLimitation } from '#/lib/format-price'
import { useUserTimeZone } from '#/lib/use-user-time-zone'
import type { VenuePriceSighting, venue } from '#/types/venue'

interface ManagePricesTableProps {
  venue: venue
}

function formatSightedDate(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ManagePricesTable({ venue }: ManagePricesTableProps) {
  const [sightingToDelete, setSightingToDelete] =
    useState<VenuePriceSighting | null>(null)
  const timeZone = useUserTimeZone()
  const queryClient = useQueryClient()

  const prices = [...(venue.pricesSighted ?? [])].sort((a, b) =>
    b.timeSighted.localeCompare(a.timeSighted),
  )

  const { mutate, reset, isPending, isError, error } = useMutation({
    mutationFn: (id: string) =>
      graphqlFetch<{ deletePriceSighting: boolean }>(
        DELETE_PRICE_SIGHTING,
        { id },
        ADMIN_TOKEN,
      ),
    onSuccess: () => {
      setSightingToDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
      void queryClient.invalidateQueries({ queryKey: ['nearbyVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['cityVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['venuePages'] })
      void queryClient.invalidateQueries({ queryKey: ['search'] })
    },
  })

  function openConfirmation(sighting: VenuePriceSighting) {
    reset()
    setSightingToDelete(sighting)
  }

  function closeConfirmation() {
    if (isPending) return

    reset()
    setSightingToDelete(null)
  }

  function confirmDelete() {
    if (sightingToDelete?.id) mutate(sightingToDelete.id)
  }

  if (prices.length === 0) {
    return (
      <p className="text-sm text-(--sea-ink-soft)">
        No price sightings have been reported for this venue.
      </p>
    )
  }

  const errorMessage = isError
    ? `Could not delete the price sighting${error instanceof Error ? `: ${error.message}` : '.'}`
    : null

  return (
    <>
      <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl bg-(--surface-strong) text-(--sea-ink)">
        <table
          aria-label="Price sightings"
          className="striped-table w-full min-w-max border-collapse text-left text-sm"
        >
          <thead className="bg-(--chip-bg)">
            <tr className="text-xs font-bold tracking-wide uppercase text-(--sea-ink-soft)">
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Price
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Details
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Reported
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {prices.map((sighting, index) => {
              const limitation = formatPriceLimitation(sighting, timeZone)
              const reported = formatSightedDate(sighting.timeSighted)

              return (
                <tr
                  key={
                    sighting.id ??
                    `${sighting.size}-${sighting.sizeMl ?? ''}-${sighting.timeSighted}-${index}`
                  }
                  className="transition-colors"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 font-bold whitespace-nowrap"
                  >
                    {formatPrice(sighting)}
                  </th>
                  <td className="px-4 py-3 text-(--sea-ink-soft)">
                    {limitation ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft) whitespace-nowrap">
                    <time dateTime={sighting.timeSighted}>{reported}</time>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="danger"
                      onClick={() => openConfirmation(sighting)}
                      disabled={!sighting.id}
                      className="px-2.5 py-1.5 text-xs whitespace-nowrap"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sightingToDelete && (
        <ConfirmDialog
          open
          title="Delete price sighting?"
          description={
            <>
              The <strong>{formatPrice(sightingToDelete)}</strong> price
              sighting will be permanently deleted. This cannot be undone.
            </>
          }
          confirmLabel="Delete price"
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
