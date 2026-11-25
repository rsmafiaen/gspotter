import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * The first render returns the initial value immediately, so callers can render
 * a controlled input without a debounce delay while derived work (such as an
 * API query) waits for the user to pause typing.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs)

    return () => clearTimeout(timeout)
  }, [delayMs, value])

  return debouncedValue
}
