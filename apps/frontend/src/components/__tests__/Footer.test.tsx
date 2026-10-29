import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Footer from '../Footer'

describe('Footer', () => {
  it('renders the copyright notice with the current year', () => {
    render(<Footer />)

    expect(
      screen.getByText(
        `© ${new Date().getFullYear()} RSM. All rights reserved.`,
      ),
    ).toBeInTheDocument()
  })
})
