import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { DeleteReviewsPanel } from '#/components/admin/DeleteReviewsPanel'
import { EditVenueForm } from '#/components/admin/EditVenueForm'
import { ManagePricesTable } from '#/components/admin/ManagePricesTable'
import { venuesQueryOptions } from '#/graphql/venues'

export const Route = createFileRoute('/admin/venues/$venueId')({
  component: AdminVenuePage,
})

export function AdminVenuePage() {
  const { venueId } = Route.useParams()
  const { data, isPending, isError } = useQuery(venuesQueryOptions)

  if (isPending) {
    return (
      <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm">
        Loading venue…
      </p>
    )
  }

  if (isError) {
    return (
      <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm">
        Could not load this venue.
      </p>
    )
  }

  const current = data.venue.find((candidate) => candidate.id === venueId)

  if (!current) {
    return (
      <div className="rounded-2xl bg-(--surface-strong) p-5 text-sm text-(--sea-ink)">
        <p>Venue not found.</p>
        <Link
          to="/admin"
          className="mt-2 inline-block font-bold text-(--lagoon-deep) hover:underline"
        >
          ← Back to admin
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to="/admin"
          className="text-sm font-bold text-(--lagoon-deep) hover:underline"
        >
          ← All venues
        </Link>
        <h2 className="mt-2 text-xl font-extrabold">{current.name}</h2>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          {current.address} · {current.city.name}
        </p>
      </div>

      <section
        aria-labelledby="venue-details-heading"
        className="rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)"
      >
        <h2 id="venue-details-heading" className="text-xl font-extrabold">
          Venue details
        </h2>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          Update the name, address, city and opening hours for this venue.
        </p>
        <EditVenueForm key={current.id} venue={current} />
      </section>

      <section
        aria-labelledby="venue-prices-heading"
        className="rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)"
      >
        <h2 id="venue-prices-heading" className="text-xl font-extrabold">
          Price sightings
        </h2>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          View and remove prices reported for {current.name}.
        </p>
        <div className="mt-4">
          <ManagePricesTable venue={current} />
        </div>
      </section>

      <section
        aria-labelledby="venue-reviews-heading"
        className="rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)"
      >
        <h2 id="venue-reviews-heading" className="text-xl font-extrabold">
          Reviews
        </h2>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          Delete reviews that should no longer be shown for {current.name}.
        </p>
        <div className="mt-4">
          <DeleteReviewsPanel venues={[current]} />
        </div>
      </section>
    </div>
  )
}
