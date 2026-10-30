import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import Breadcrumbs from '#/components/Breadcrumbs'
import AddReviewDialog from '#/components/AddReviewDialog'
import { venueToSearchResult } from '#/components/VenueCard'
import { ViewVenue } from '#/components/ViewVenue'
import ClientVenueMap from '#/components/ClientVenueMap'
import { venuesQueryOptions } from '#/graphql/venues'

export const Route = createFileRoute('/$cityId/venues/$venueId')({
  // Prefetch during SSR: the venue page used to paint a loading shell first, so
  // the footer moved and the map tiles became the LCP element.
  loader: ({ context }) =>
    context.queryClient.prefetchQuery(venuesQueryOptions),
  component: VenuePage,
})

function VenuePage() {
  const { cityId, venueId } = Route.useParams()
  const { data, isPending, isError } = useQuery(venuesQueryOptions)

  if (isPending) {
    return (
      <PageShell>
        <p>Loading venue…</p>
      </PageShell>
    )
  }

  if (isError) {
    return (
      <PageShell>
        <p>Could not load this venue.</p>
      </PageShell>
    )
  }

  const current = data.venue.find((candidate) => candidate.id === venueId)

  if (!current || current.city.id !== cityId) {
    return (
      <PageShell>
        <p>Venue not found in this city.</p>
        <BackLink />
      </PageShell>
    )
  }

  const reviews = [...current.reviews].sort((a, b) =>
    b.timeCreated.localeCompare(a.timeCreated),
  )

  return (
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <h1 className="sr-only">{current.name}</h1>
      <Breadcrumbs
        items={[
          { label: current.city.name, cityId: current.city.id },
          { label: current.name },
        ]}
      />

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <ViewVenue venue={venueToSearchResult(current)} />
        <section
          aria-label={`Map showing ${current.name}`}
          className="overflow-hidden rounded-2xl bg-(--surface-strong) p-2"
        >
          <ClientVenueMap
            lat={current.lat}
            lon={current.lon}
            name={current.name}
          />
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-xl font-extrabold">Reviews</h2>
            <span className="text-xs font-bold text-(--sea-ink-soft)">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          <AddReviewDialog venueId={current.id} venueName={current.name} />
        </div>

        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-(--sea-ink-soft)">No reviews yet.</p>
        ) : (
          <ul className="mt-4 striped-list">
            {reviews.map((review) => (
              <li key={review.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{review.username}</p>
                    <Rating rating={review.rating} />
                  </div>
                  <time
                    dateTime={review.timeCreated}
                    className="text-xs text-(--sea-ink-soft)"
                  >
                    {formatReviewDate(review.timeCreated)}
                  </time>
                </div>
                <p className="mt-2 text-sm text-(--sea-ink-soft)">
                  {review.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <div className="rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)">
        {children}
      </div>
    </main>
  )
}

function BackLink() {
  return (
    <Link
      to="/"
      className="text-sm font-bold text-(--lagoon-deep) hover:underline"
    >
      ← Back to venues
    </Link>
  )
}

function Rating({ rating }: { rating: number }) {
  const percent = Math.max(0, Math.min(100, (rating / 5) * 100))

  return (
    <span className="mt-1 inline-flex items-center gap-2">
      <span
        role="img"
        aria-label={`${rating} out of 5 stars`}
        className="relative inline-block whitespace-nowrap text-base leading-none tracking-[0.08em]"
      >
        <span aria-hidden="true" className="text-(--line)">
          ★★★★★
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap text-amber-500"
          style={{ width: `${percent}%` }}
        >
          ★★★★★
        </span>
      </span>
      <span className="text-xs font-bold text-(--sea-ink-soft)">
        {rating} / 5
      </span>
    </span>
  )
}

function formatReviewDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(iso))
}
