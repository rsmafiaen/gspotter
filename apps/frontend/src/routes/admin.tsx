import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { AddVenueDialog } from '#/components/admin/AddVenueDialog'
import { VenueTable } from '#/components/admin/VenueTable'
import { venuesQueryOptions } from '#/graphql/venues'

export const Route = createFileRoute('/admin')({
  loader: ({ context }) =>
    context.queryClient.prefetchQuery(venuesQueryOptions),
  component: AdminPage,
})

function AdminPage() {
  const { data, isPending, isError } = useQuery(venuesQueryOptions)

  return (
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Admin</h1>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Manage the venues shown on the map and their opening hours.
          </p>
        </div>
        <AddVenueDialog />
      </div>

      <div className="mt-6">
        {isPending && (
          <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm">
            Loading venues…
          </p>
        )}

        {isError && (
          <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm">
            Could not load venues.
          </p>
        )}

        {data && (
          <>
            <p className="mb-3 text-xs font-bold text-(--sea-ink-soft)">
              {data.venue.length} {data.venue.length === 1 ? 'venue' : 'venues'}
            </p>
            <VenueTable venues={data.venue} />
          </>
        )}
      </div>
    </main>
  )
}
