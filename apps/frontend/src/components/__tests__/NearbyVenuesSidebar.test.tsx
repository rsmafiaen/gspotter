import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'

import { makeSearchResult } from '#/test/fixtures'
import { renderWithProviders } from '#/test/render'
import NearbyVenuesSidebar from '../NearbyVenuesSidebar'

vi.mock('#/lib/use-user-time-zone', () => ({
  useUserTimeZone: () => 'UTC',
}))

type SidebarProps = ComponentProps<typeof NearbyVenuesSidebar>

function renderSidebar(overrides: Partial<SidebarProps> = {}) {
  return renderWithProviders(
    <NearbyVenuesSidebar
      venues={[makeSearchResult()]}
      hasLocation
      locating={false}
      locationError={null}
      isLoading={false}
      isError={false}
      maxDistanceKm={null}
      onRefresh={vi.fn()}
      {...overrides}
    />,
  )
}

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

describe('NearbyVenuesSidebar', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts as a closed bottom sheet on mobile', async () => {
    const { user } = renderSidebar()

    const handle = await screen.findByRole('button', {
      name: 'Show nearby pubs',
    })

    expect(handle).toHaveAttribute('aria-expanded', 'false')
    expect(handle.parentElement).toHaveClass('nearby-sheet-hint')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    await user.click(handle)

    expect(
      screen.getByRole('button', { name: 'Hide nearby pubs' }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('starts open on desktop and can be collapsed', async () => {
    mockMatchMedia(true)
    const { user } = renderSidebar()

    const hideButton = await screen.findByRole('button', {
      name: 'Hide nearby pubs',
    })

    expect(screen.getByRole('list')).toBeInTheDocument()

    await user.click(hideButton)

    expect(
      await screen.findByRole('button', { name: 'Pubs near you' }),
    ).toBeInTheDocument()
  })

  it('refreshes the location from the sidebar', async () => {
    const onRefresh = vi.fn()
    const { user } = renderSidebar({ onRefresh })

    await user.click(
      await screen.findByRole('button', { name: 'Show nearby pubs' }),
    )
    await user.click(screen.getByRole('button', { name: 'Refresh location' }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
