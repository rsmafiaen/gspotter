import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminLogin } from '../admin/AdminLogin'
import { isAdminAuthenticated } from '#/lib/admin-auth'

describe('AdminLogin', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('shows a secret-password field', () => {
    render(<AdminLogin onAuthenticated={() => {}} />)

    expect(
      screen.getByRole('heading', { name: 'Admin access' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Secret password')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Enter the secret password'),
    ).toBeInTheDocument()
  })

  it('rejects an incorrect password', async () => {
    const user = userEvent.setup()
    const onAuthenticated = vi.fn()

    render(<AdminLogin onAuthenticated={onAuthenticated} />)

    await user.type(screen.getByLabelText('Secret password'), 'stout')
    await user.click(screen.getByRole('button', { name: 'Enter admin' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Incorrect password.',
    )
    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(isAdminAuthenticated()).toBe(false)
    expect(screen.getByLabelText('Secret password')).toHaveValue('')
  })

  it('authenticates with guinness and persists the session', async () => {
    const user = userEvent.setup()
    const onAuthenticated = vi.fn()

    render(<AdminLogin onAuthenticated={onAuthenticated} />)

    await user.type(screen.getByLabelText('Secret password'), 'guinness')
    await user.click(screen.getByRole('button', { name: 'Enter admin' }))

    expect(onAuthenticated).toHaveBeenCalledOnce()
    expect(isAdminAuthenticated()).toBe(true)
  })
})
