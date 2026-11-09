import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { MAP_STYLE_URLS } from '#/lib/map-styles'
import { makeSearchResult } from '#/test/fixtures'
import Map from '../Map'
import VenueMap from '../VenueMap'

const { flyTo } = vi.hoisted(() => ({
  flyTo: vi.fn(),
}))

interface MapContainerProps {
  children: ReactNode
  center: [number, number]
  zoom: number
}

interface MarkerProps {
  children?: ReactNode
  position: [number, number]
  title?: string
}

interface CircleMarkerProps {
  children?: ReactNode
  center: [number, number]
}

interface PopupProps {
  children?: ReactNode
}

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom }: MapContainerProps) => (
    <div data-testid="map" data-center={center.join(',')} data-zoom={zoom}>
      {children}
    </div>
  ),
  Marker: ({ children, position, title }: MarkerProps) => (
    <div
      data-testid="marker"
      data-position={position.join(',')}
      data-title={title}
    >
      {children}
    </div>
  ),
  CircleMarker: ({ children, center }: CircleMarkerProps) => (
    <div data-testid="circle-marker" data-center={center.join(',')}>
      {children}
    </div>
  ),
  Popup: ({ children }: PopupProps) => (
    <div data-testid="popup">{children}</div>
  ),
  Tooltip: ({ children }: PopupProps) => (
    <div data-testid="tooltip">{children}</div>
  ),
  useMap: () => ({ flyTo }),
}))

vi.mock('leaflet', () => ({
  default: {
    Icon: class MockIcon {},
  },
}))

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="marker-cluster">{children}</div>
  ),
}))

vi.mock('../VectorTileLayer', () => ({
  VectorTileLayer: ({ styleUrl }: { styleUrl: string }) => (
    <div data-testid="vector-tile-layer" data-style={styleUrl} />
  ),
}))

vi.mock('#/lib/use-theme-mode', () => ({
  useThemeMode: () => 'light',
}))

describe('Map', () => {
  it('renders a map, tile layer and markers for nearby venues', () => {
    const venue = makeSearchResult()

    render(<Map nearby={[venue]} />)

    expect(screen.getByTestId('map')).toHaveAttribute(
      'data-center',
      '63.4305,10.3951',
    )
    expect(screen.getByTestId('map')).toHaveAttribute('data-zoom', '15')
    expect(screen.getByTestId('vector-tile-layer')).toHaveAttribute(
      'data-style',
      MAP_STYLE_URLS.light,
    )

    const marker = screen.getByTestId('marker')

    expect(marker).toHaveAttribute('data-position', `${venue.lat},${venue.lon}`)
    expect(marker).toHaveTextContent(venue.name)
    expect(marker).toHaveTextContent(venue.address!)
    expect(marker).toHaveTextContent('NOK 89 · 500 ml')
  })

  it('deduplicates venues with the same name and coordinates', () => {
    const venue = makeSearchResult()

    render(
      <Map
        nearby={[
          venue,
          { ...venue },
          makeSearchResult({ id: 'other', name: 'Other' }),
        ]}
      />,
    )

    expect(screen.getAllByTestId('marker')).toHaveLength(2)
  })

  it('marks the user location and describes a mock location', () => {
    render(<Map userLocation={{ lat: 63.4, lon: 10.4 }} isMockLocation />)

    expect(screen.getByTestId('circle-marker')).toHaveAttribute(
      'data-center',
      '63.4,10.4',
    )
    expect(
      screen.getByText('Mock location: NTNU Realfagsbygget'),
    ).toBeInTheDocument()
  })

  it('describes a real user location', () => {
    render(<Map userLocation={{ lat: 63.4, lon: 10.4 }} />)

    expect(screen.getByText('Your location')).toBeInTheDocument()
  })

  it('flies to new coordinates when they change', async () => {
    const { rerender } = render(<Map />)

    expect(flyTo).not.toHaveBeenCalled()

    rerender(<Map flyTo={[63.42, 10.39]} />)

    await waitFor(() => {
      expect(flyTo).toHaveBeenCalledWith([63.42, 10.39], 12)
    })
  })
})

describe('VenueMap', () => {
  it('centres the map on the venue and adds a marker', () => {
    render(<VenueMap lat={63.42} lon={10.39} name="Studentersamfundet" />)

    expect(screen.getByTestId('map')).toHaveAttribute(
      'data-center',
      '63.42,10.39',
    )
    expect(screen.getByTestId('map')).toHaveAttribute('data-zoom', '16')
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-position',
      '63.42,10.39',
    )
    expect(screen.getByTestId('marker')).toHaveAttribute(
      'data-title',
      'Studentersamfundet',
    )
  })
})
