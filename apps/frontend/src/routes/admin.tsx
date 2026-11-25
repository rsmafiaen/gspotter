import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { AdminLogin } from '#/components/admin/AdminLogin'
import { AddVenueDialog } from '#/components/admin/AddVenueDialog'
import { DeleteReviewsPanel } from '#/components/admin/DeleteReviewsPanel'
import { VenueTable } from '#/components/admin/VenueTable'
import { Button } from '#/components/ui/Button'
import { venuesQueryOptions } from '#/graphql/venues'
import { isAdminAuthenticated, signOutAdmin } from '#/lib/admin-auth'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

const TABS = [
  { id: 'venues', label: 'Venues' },
  { id: 'delete-reviews', label: 'Reviews' },
] as const

type AdminTab = (typeof TABS)[number]['id']

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated())
  }, [])

  if (isAuthenticated === null) {
    return (
      <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
        <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm">
          Checking access…
        </p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />
  }

  return (
    <AdminDashboard
      onSignOut={() => {
        signOutAdmin()
        setIsAuthenticated(false)
      }}
    />
  )
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const { data, isPending, isError } = useQuery(venuesQueryOptions)
  const [activeTab, setActiveTab] = useState<AdminTab>('venues')
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const lastIndex = TABS.length - 1
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight') {
      nextIndex = index === lastIndex ? 0 : index + 1
    } else if (event.key === 'ArrowLeft') {
      nextIndex = index === 0 ? lastIndex : index - 1
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = lastIndex
    }

    if (nextIndex === null) return

    event.preventDefault()
    setActiveTab(TABS[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Admin</h1>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Manage the venues shown on the map, their opening hours and reviews.
          </p>
        </div>
        <Button variant="ghost" onClick={onSignOut}>
          Sign out
        </Button>
      </div>

      <div className="mt-6">
        <div
          role="tablist"
          aria-label="Admin sections"
          className="flex flex-wrap gap-1 border-b border-(--line)"
        >
          {TABS.map((tab, index) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                ref={(element) => {
                  tabRefs.current[index] = element
                }}
                type="button"
                role="tab"
                id={`admin-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`admin-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep) ${
                  isActive
                    ? 'border-(--lagoon-deep) text-(--sea-ink)'
                    : 'border-transparent text-(--sea-ink-soft) hover:text-(--sea-ink)'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <div
          id={`admin-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`admin-tab-${activeTab}`}
          tabIndex={0}
          className="mt-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
        >
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

          {data && activeTab === 'venues' && (
            <>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <p className="text-xs font-bold text-(--sea-ink-soft)">
                  {data.venue.length}{' '}
                  {data.venue.length === 1 ? 'venue' : 'venues'}
                </p>
                <AddVenueDialog />
              </div>
              <VenueTable venues={data.venue} />
            </>
          )}

          {data && activeTab === 'delete-reviews' && (
            <DeleteReviewsPanel venues={data.venue} />
          )}
        </div>
      </div>
    </main>
  )
}
