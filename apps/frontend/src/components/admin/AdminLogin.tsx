import { useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '#/components/ui/Button'
import { FormField, inputClassName } from '#/components/ui/FormField'
import { signInAdmin } from '#/lib/admin-auth'

interface AdminLoginProps {
  onAuthenticated: () => void
}

export function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const passwordId = useId()
  const passwordRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (signInAdmin(password)) {
      setError(null)
      onAuthenticated()
      return
    }

    setPassword('')
    setError('Incorrect password.')
    passwordRef.current?.focus()
  }

  return (
    <main id="main-content" className="page-wrap px-4 pb-8 pt-14">
      <section className="mx-auto max-w-md rounded-2xl bg-(--surface-strong) p-6 text-(--sea-ink)">
        <h1 className="text-2xl font-extrabold">Admin access</h1>
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          Enter the secret password to manage venues, prices and reviews.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <FormField label="Secret password" htmlFor={passwordId}>
            <input
              ref={passwordRef}
              id={passwordId}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              placeholder="Enter the secret password"
              className={inputClassName}
            />
          </FormField>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-(--sea-ink)"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit">Enter admin</Button>
          </div>
        </form>
      </section>
    </main>
  )
}
