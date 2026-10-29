import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Header from '../Header'

describe('Header', () => {
  it('renders the brand link and the theme toggle', () => {
    render(<Header />)

    const banner = screen.getByRole('banner')

    expect(
      within(banner).getByRole('link', { name: 'G-SPOTTER' }),
    ).toHaveAttribute('href', '/')
    expect(
      within(banner).getByRole('button', { name: /theme mode/i }),
    ).toBeInTheDocument()
  })
})
