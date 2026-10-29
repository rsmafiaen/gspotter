import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import ThemeToggle from '../ThemeToggle'

describe('ThemeToggle', () => {
  it('starts in dark mode and applies the theme to the document', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /theme mode: dark/i })

    expect(button).toHaveTextContent('Dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('restores a previously stored light theme', () => {
    window.localStorage.setItem('theme', 'light')

    render(<ThemeToggle />)

    expect(
      screen.getByRole('button', { name: /theme mode: light/i }),
    ).toHaveTextContent('Light')
    expect(document.documentElement).toHaveClass('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('toggles between light and dark mode and stores the choice', async () => {
    const { user } = renderWithUser()

    await user.click(screen.getByRole('button', { name: /theme mode: dark/i }))

    expect(
      screen.getByRole('button', { name: /theme mode: light/i }),
    ).toHaveTextContent('Light')
    expect(document.documentElement).toHaveClass('light')
    expect(window.localStorage.getItem('theme')).toBe('light')

    await user.click(screen.getByRole('button', { name: /theme mode: light/i }))

    expect(
      screen.getByRole('button', { name: /theme mode: dark/i }),
    ).toHaveTextContent('Dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')
  })
})

function renderWithUser() {
  const user = userEvent.setup()
  render(<ThemeToggle />)

  return { user }
}
