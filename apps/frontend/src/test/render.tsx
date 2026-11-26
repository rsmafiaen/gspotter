import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface RenderOptions {
  /** Initial location for the in-memory router. */
  route?: string
  /** Pass a client when the test needs to inspect or seed the cache. */
  queryClient?: QueryClient
}

/**
 * Renders a component with the providers it needs: a React Query client and a
 * small in-memory router that understands the app's venue routes. Components
 * that use `<Link>` or `useNavigate` can therefore be tested without booting
 * the real TanStack Start app.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', queryClient = createTestQueryClient() }: RenderOptions = {},
) {
  const renderUi = () => ui

  const rootRoute = createRootRoute({ component: Outlet })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: renderUi,
  })
  const cityRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$cityId/venues',
    component: renderUi,
  })
  const venueRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/$cityId/venues/$venueId',
    component: renderUi,
  })
  const adminRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin',
    component: renderUi,
  })
  const adminVenueRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/admin/venues/$venueId',
    component: renderUi,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      cityRoute,
      venueRoute,
      adminRoute,
      adminVenueRoute,
    ]),
    history: createMemoryHistory({ initialEntries: [route] }),
    defaultPendingMinMs: 0,
  })

  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return {
    ...result,
    router,
    queryClient,
    user: userEvent.setup(),
  }
}
