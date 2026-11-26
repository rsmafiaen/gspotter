import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { AddVenueDialog } from '#/components/admin/AddVenueDialog'
import { VenueTable } from '#/components/admin/VenueTable'
import SidebarVenuePagination from '#/components/SidebarVenuePagination'
import { FormField, inputClassName } from '#/components/ui/FormField'
import { CITY_SEARCH } from '#/graphql/cities'
import { graphqlFetch } from '#/graphql/client'
import {
  adminVenuesQueryOptions,
  venueCountFromPages,
  venuesFromPages,
} from '#/graphql/venues'
import type { City } from '#/types/city'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

export function AdminDashboard() {
  const cityFilterId = useId()
  const [cityId, setCityId] = useState('')
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data: cityData } = useQuery({
    queryKey: ['citySearch', ''],
    queryFn: () => graphqlFetch<{ city: City[] }>(CITY_SEARCH, { name: '' }),
    staleTime: 5 * 60 * 1000,
  })

  const {
    data,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = useInfiniteQuery(adminVenuesQueryOptions(cityId || null))

  const venues = useMemo(() => venuesFromPages(data), [data])
  const totalVenues = venueCountFromPages(data) ?? venues.length
  const cities = cityData?.city ?? []

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
      { rootMargin: '400px 0px' },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const countLabel =
    hasNextPage && venues.length < totalVenues
      ? `${venues.length} of ${totalVenues} venues loaded`
      : `${totalVenues} ${totalVenues === 1 ? 'venue' : 'venues'}`

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <FormField
          label="Filter by city"
          htmlFor={cityFilterId}
          className="w-full max-w-xs"
        >
          <select
            id={cityFilterId}
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
            className={inputClassName}
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option
                key={city.id}
                value={city.id}
                title={city.displayName ?? undefined}
              >
                {city.name}
              </option>
            ))}
          </select>
        </FormField>

        <AddVenueDialog />
      </div>

      {isPending && (
        <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm">
          Loading venues…
        </p>
      )}

      {!isPending && isError && (
        <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm">
          Could not load venues.
        </p>
      )}

      {!isPending && !isError && (
        <>
          <p className="text-xs font-bold text-(--sea-ink-soft)">
            {countLabel}
          </p>

          <VenueTable
            venues={venues}
            emptyMessage={
              cityId
                ? 'No venues have been added for this city.'
                : 'No venues have been added yet.'
            }
          />

          {venues.length > 0 && (
            <SidebarVenuePagination
              hasMorePages={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              isFetchNextPageError={isFetchNextPageError}
              onLoadMore={() => void fetchNextPage()}
              sentinelRef={sentinelRef}
            />
          )}
        </>
      )}
    </div>
  )
}
