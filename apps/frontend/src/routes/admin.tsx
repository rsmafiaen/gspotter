import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { AdminLogin } from '#/components/admin/AdminLogin'
import { Button } from '#/components/ui/Button'
import { isAdminAuthenticated, signOutAdmin } from '#/lib/admin-auth'

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
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
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Admin</h1>
          <p className="mt-1 text-sm text-(--sea-ink-soft)">
            Manage the venues shown on the map, their opening hours, prices and
            reviews.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            signOutAdmin()
            setIsAuthenticated(false)
          }}
        >
          Sign out
        </Button>
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </main>
  )
}
