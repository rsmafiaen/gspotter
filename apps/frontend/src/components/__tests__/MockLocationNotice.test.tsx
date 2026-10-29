import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import MockLocationNotice from '../MockLocationNotice'

describe('MockLocationNotice', () => {
  it('explains why a mock location is used and links to the repository', () => {
    render(<MockLocationNotice />)

    expect(screen.getByText('Mock position')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'We are showing a mock position instead of your real one',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/sorted by distance from NTNU Realfagsbygget/),
    ).toBeInTheDocument()

    const repositoryLink = screen.getByRole('link', {
      name: 'the repository',
    })

    expect(repositoryLink).toHaveAttribute(
      'href',
      'https://git.ntnu.no/IT2810-H26/T09-Project-2',
    )
    expect(repositoryLink).toHaveAttribute('target', '_blank')
    expect(repositoryLink).toHaveAttribute('rel', 'noreferrer')
  })
})
