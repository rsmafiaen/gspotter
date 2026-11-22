import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makePriceSighting } from '#/test/fixtures'
import { VenuePrices } from '../VenuePrices'

vi.mock('#/lib/use-user-time-zone', () => ({
  useUserTimeZone: () => 'UTC',
}))

describe('VenuePrices', () => {
  it('renders every price with limitation labels', () => {
    render(
      <VenuePrices
        prices={[
          makePriceSighting({
            price: 169,
            size: 'HALF_LITER',
            sizeMl: 500,
            Limitations: [],
          }),
          makePriceSighting({
            price: 129,
            size: 'PINT',
            sizeMl: 568,
            Limitations: ['MEMBERSHIP'],
          }),
          makePriceSighting({
            price: 139,
            size: 'PINT',
            sizeMl: 568,
            Limitations: ['TIME'],
            timeStart: '1970-01-01T15:00:00.000Z',
            timeEnd: '1970-01-01T17:00:00.000Z',
          }),
        ]}
      />,
    )

    expect(screen.getByText('NOK 169 · 500 ml')).toBeInTheDocument()
    expect(screen.getByText('NOK 129 · 568 ml')).toBeInTheDocument()
    expect(screen.getByText('NOK 139 · 568 ml')).toBeInTheDocument()
    expect(screen.getByText('Member price')).toBeInTheDocument()
    expect(screen.getByText('Happy hour 15:00–17:00')).toBeInTheDocument()
  })

  it('sorts by volume, then regular before limited, then price', () => {
    render(
      <VenuePrices
        prices={[
          makePriceSighting({
            price: 60,
            size: 'HALF_LITER',
            sizeMl: null,
          }),
          makePriceSighting({
            price: 75,
            size: 'PINT',
            sizeMl: null,
            Limitations: ['MEMBERSHIP'],
          }),
          makePriceSighting({
            price: 89,
            size: 'PINT',
            sizeMl: null,
          }),
          makePriceSighting({
            price: 65,
            size: 'PINT',
            sizeMl: null,
            Limitations: ['TIME'],
            timeStart: '1970-01-01T15:00:00.000Z',
            timeEnd: '1970-01-01T17:00:00.000Z',
          }),
          makePriceSighting({
            price: 35,
            size: 'QUARTER_LITER',
            sizeMl: null,
          }),
          makePriceSighting({
            price: 55,
            size: 'CAN',
            sizeMl: null,
          }),
          makePriceSighting({
            price: 45,
            size: 'OTHER',
            sizeMl: 330,
          }),
        ]}
      />,
    )

    const rows = screen.getAllByRole('listitem').map((li) => li.textContent)

    expect(rows[0]).toContain('NOK 89 · pint')
    expect(rows[1]).toContain('NOK 65 · pint')
    expect(rows[2]).toContain('NOK 75 · pint')
    expect(rows[3]).toContain('NOK 60 · half liter')
    expect(rows[4]).toContain('NOK 55 · can')
    expect(rows[5]).toContain('NOK 45 · 330 ml')
    expect(rows[6]).toContain('NOK 35 · quarter liter')
  })

  it('shows an empty state when no prices exist', () => {
    render(<VenuePrices prices={[]} />)

    expect(screen.getByText('No prices reported yet.')).toBeInTheDocument()
  })
})
