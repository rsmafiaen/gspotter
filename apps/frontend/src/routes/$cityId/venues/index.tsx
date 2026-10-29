import type { ReactNode } from 'react'
import type { venue } from '#/types/venue'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import Breadcrumbs from '#/components/Breadcrumbs'
import VenueCard from '#/components/VenueCard'
import { graphqlFetch } from '#/graphql/client'
import { GET_VENUE } from '#/graphql/venues'

export const Route = createFileRoute('/$cityId/venues/')({
  component: CityVenuesPage,
})

function CityVenuesPage() {
  const { cityId } = Route.useParams()
  const { data, isPending, isError } = useQuery({
    queryKey: ['venues'],
    queryFn: () => graphqlFetch<{ venue: venue[] }>(GET_VENUE),
  })

  if (isPending) {
    return (
      <PageShell>
        <p>Loading venues…</p>
      </PageShell>
    )
  }

  if (isError) {
    return (
      <PageShell>
        <p>Could not load venues.</p>
      </PageShell>
    )
  }

  const venues = data.venue
    .filter((venue) => venue.city.id === cityId)
    .sort((a, b) => a.name.localeCompare(b.name))
  const cityName = venues[0]?.city.name

  if (!cityName) {
    return (
      <PageShell>
        <p>No venues found in this city.</p>
        <Link
          to="/"
          className="mt-3 inline-block text-sm font-bold text-(--lagoon-deep) hover:underline"
        >
          ← Back to venues
        </Link>
      </PageShell>
    )
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <Breadcrumbs items={[{ label: cityName }]} />
      <h1 className="mt-4 text-3xl font-extrabold">{cityName}</h1>
      <p className="mt-1 text-sm text-(--sea-ink-soft)">
        {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
      </p>

      <div className="mt-6 grid gap-6">
        {venues.map((venue) => (
          <VenueCard key={venue.id} current={venue} />
        ))}
      </div>
    </main>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <div className="rounded-2xl border border-(--line) bg-(--surface-strong) p-5 text-(--sea-ink)">
        {children}
      </div>
    </main>
  )
}
