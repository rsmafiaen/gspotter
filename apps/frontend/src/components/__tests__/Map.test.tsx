import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { MAP_STYLE_URLS } from '#/lib/map-styles'
import { makeSearchResult } from '#/test/fixtures'
import Map from '../Map'
import VenueMap from '../VenueMap'

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

interface PopupProps {
  children?: ReactNode
}

const { flyTo } = vi.hoisted(() => ({ flyTo: vi.fn() }))

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
  Popup: ({ children }: PopupProps) => (
    <div data-testid="popup">{children}</div>
  ),
  Tooltip: ({ children }: PopupProps) => (
    <div data-testid="tooltip">{children}</div>
  ),
  ZoomControl: ({ position }: { position: string }) => (
    <div data-testid="zoom-control" data-position={position} />
  ),
  useMap: () => ({
    flyTo,
    setView: vi.fn(),
    getZoom: () => 3,
    on: vi.fn(),
    off: vi.fn(),
    getContainer: () => ({
      style: { setProperty: vi.fn() },
      querySelector: () => null,
    }),
  }),
}))

vi.mock('leaflet', () => ({
  default: {
    Icon: class MockIcon {},
    divIcon: () => ({}),
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
  beforeEach(() => {
    flyTo.mockClear()
  })

  it('renders a map, tile layer and markers for nearby venues', () => {
    const venue = makeSearchResult()

    render(<Map nearby={[venue]} />)

    expect(screen.getByTestId('map')).toHaveAttribute(
      'data-center',
      '63.415458,10.406021',
    )
    expect(screen.getByTestId('map')).toHaveAttribute('data-zoom', '3')
    expect(screen.getByTestId('vector-tile-layer')).toHaveAttribute(
      'data-style',
      MAP_STYLE_URLS.light,
    )
    expect(screen.getByTestId('zoom-control')).toHaveAttribute(
      'data-position',
      'bottomright',
    )

    const marker = screen.getByTestId('marker')

    expect(marker).toHaveAttribute('data-position', `${venue.lat},${venue.lon}`)
    expect(marker).toHaveTextContent(venue.name)
    expect(marker).toHaveTextContent(venue.address!)
    expect(marker).toHaveTextContent('NOK 89 · 500 ml')
  })

  it('uses a supplied centre and zoom', () => {
    render(<Map center={{ lat: 59.9139, lon: 10.7522 }} zoom={11} />)

    expect(screen.getByTestId('map')).toHaveAttribute(
      'data-center',
      '59.9139,10.7522',
    )
    expect(screen.getByTestId('map')).toHaveAttribute('data-zoom', '11')
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

    const marker = screen.getByTestId('marker')

    expect(marker).toHaveAttribute('data-position', '63.4,10.4')
    expect(marker).toHaveAttribute(
      'data-title',
      'Mock location: NTNU Realfagsbygget',
    )
    expect(
      screen.getByText('Mock location: NTNU Realfagsbygget'),
    ).toBeInTheDocument()
  })

  it('describes a real user location', () => {
    render(<Map userLocation={{ lat: 63.4, lon: 10.4 }} />)

    expect(screen.getByText('Your location')).toBeInTheDocument()
  })

  it('flies from the poster view to the user location', async () => {
    render(<Map userLocation={{ lat: 63.4, lon: 10.4 }} />)

    await waitFor(() => {
      expect(flyTo).toHaveBeenCalledWith([63.4, 10.4], 13, {
        duration: 1.6,
        easeLinearity: 0.25,
      })
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
