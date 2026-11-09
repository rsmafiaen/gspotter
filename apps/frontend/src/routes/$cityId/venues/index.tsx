import type { ReactNode } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import Breadcrumbs from '#/components/Breadcrumbs'
import VenueCard from '#/components/VenueCard'
import { cityVenuesQueryOptions } from '#/graphql/venues'

export const Route = createFileRoute('/$cityId/venues/')({
  // Prefetch during SSR so the list is in the first paint. Rendering a loading
  // shell instead makes the page grow once the data lands, which shifts the
  // footer by a sixth of the viewport.
  loader: ({ context, params }) =>
    context.queryClient.prefetchInfiniteQuery(
      cityVenuesQueryOptions(params.cityId),
    ),
  component: CityVenuesPage,
})

function CityVenuesPage() {
  const { cityId } = Route.useParams()
  const {
    data,
    isPending,
    isError,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(cityVenuesQueryOptions(cityId))
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (
      !sentinel ||
      !hasNextPage ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          !isFetchingNextPage
        ) {
          void fetchNextPage()
        }
      },
      { rootMargin: '600px 0px' },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isPending) {
    return (
      <PageShell>
        <p>Loading venues…</p>
      </PageShell>
    )
  }

  if (isError && !data) {
    return (
      <PageShell>
        <p>Could not load venues.</p>
      </PageShell>
    )
  }

  const venues = data.pages.flatMap((page) => page.venue)
  const totalVenues = data.pages[0]?.venueCount ?? venues.length
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
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <Breadcrumbs items={[{ label: cityName }]} />
      <h1 className="mt-4 text-3xl font-extrabold">{cityName}</h1>
      <p className="mt-1 text-sm text-(--sea-ink-soft)">
        {hasNextPage
          ? `${venues.length} of ${totalVenues} venues loaded`
          : `${totalVenues} ${totalVenues === 1 ? 'venue' : 'venues'}`}
      </p>

      <div className="mt-6 grid gap-6">
        {venues.map((venue) => (
          <VenueCard key={venue.id} current={venue} />
        ))}
      </div>

      {isFetchNextPageError && (
        <p role="alert" className="mt-6 text-center text-sm text-(--sea-ink)">
          Could not load more venues. Please try again.
        </p>
      )}

      {hasNextPage && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-full bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isFetchingNextPage ? 'Loading more venues…' : 'Load more venues'}
          </button>
          <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
        </div>
      )}

      {!hasNextPage && venues.length > 0 && (
        <p className="mt-6 text-center text-sm text-(--sea-ink-soft)">
          You have reached the end of the list.
        </p>
      )}
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
