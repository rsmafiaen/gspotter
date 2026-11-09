import { useEffect, useState } from 'react'

import { DEFAULT_TIME_ZONE } from './time-zone'

/**
 * Resolves the user's IANA timezone on the client. The first render (including
 * SSR) uses the venue's default timezone so the server and client markup match;
 * the effect then switches to the browser timezone.
 */
export function useUserTimeZone(fallback = DEFAULT_TIME_ZONE) {
  const [timeZone, setTimeZone] = useState(fallback)

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone

    if (detected) {
      setTimeZone(detected)
    }
  }, [])

  return timeZone
}
