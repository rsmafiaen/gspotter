import { useEffect, useState } from 'react'

/**
 * Tracks whether a CSS media query currently matches. The server (and the
 * first client render) reports `false`, so callers can use it for progressive
 * enhancements without breaking hydration.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }

    const mediaQuery = window.matchMedia(query)
    const update = () => setMatches(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  }, [query])

  return matches
}
