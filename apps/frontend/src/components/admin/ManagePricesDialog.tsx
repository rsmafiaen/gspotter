import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '#/components/ui/Button'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { Dialog, useDialog } from '#/components/ui/Dialog'
import { graphqlFetch } from '#/graphql/client'
import { DELETE_PRICE_SIGHTING } from '#/graphql/price-sightings'
import { ADMIN_TOKEN } from '#/lib/admin-token'
import { formatPrice, formatPriceLimitation } from '#/lib/format-price'
import { useUserTimeZone } from '#/lib/use-user-time-zone'
import type { VenuePriceSighting, venue } from '#/types/venue'

interface ManagePricesDialogProps {
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

export function ManagePricesDialog({ venue }: ManagePricesDialogProps) {
  return (
    <Dialog
      trigger={<Button>Manage prices</Button>}
      title="Manage price sightings"
      description={`View and remove prices reported for ${venue.name}.`}
    >
      <ManagePricesContent venue={venue} />
    </Dialog>
  )
}

function ManagePricesContent({ venue }: ManagePricesDialogProps) {
  const { close } = useDialog()
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

  const errorMessage = isError
    ? `Could not delete the price sighting${error instanceof Error ? `: ${error.message}` : '.'}`
    : null

  return (
    <div className="mt-5 grid gap-4">
      {prices.length === 0 ? (
        <p className="text-sm text-(--sea-ink-soft)">
          No price sightings have been reported for this venue.
        </p>
      ) : (
        <ul className="grid gap-2">
          {prices.map((sighting, index) => {
            const limitation = formatPriceLimitation(sighting, timeZone)
            const details = limitation
              ? `${limitation} · Reported ${formatSightedDate(sighting.timeSighted)}`
              : `Reported ${formatSightedDate(sighting.timeSighted)}`

            return (
              <li
                key={
                  sighting.id ??
                  `${sighting.size}-${sighting.sizeMl ?? ''}-${sighting.timeSighted}-${index}`
                }
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-(--chip-bg) px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold">{formatPrice(sighting)}</p>
                  <p className="text-xs text-(--sea-ink-soft)">{details}</p>
                </div>
                <Button
                  variant="danger"
                  onClick={() => openConfirmation(sighting)}
                  disabled={!sighting.id}
                  className="px-2.5 py-1.5 text-xs whitespace-nowrap"
                >
                  Delete
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" onClick={close}>
          Close
        </Button>
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
    </div>
  )
}
