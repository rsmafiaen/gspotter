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

  it('shows an empty state when no prices exist', () => {
    render(<VenuePrices prices={[]} />)

    expect(screen.getByText('No prices reported yet.')).toBeInTheDocument()
  })
})
