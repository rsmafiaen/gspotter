import { useCallback, useEffect, useRef, useState } from 'react'

import {
  MOCK_LOCATION,
  describeLocationError,
  readStoredLocation,
  requestAndStoreLocation,
  usesMockLocation,
} from './location'
import type { Coordinates } from './location'

export interface UserLocationState {
  coordinates: Coordinates | null
  locating: boolean
  locationError: string | null
  usingMockLocation: boolean
  refreshLocation: () => Promise<void>
}

/**
 * Resolves the user's position, reusing the cached copy for 24 hours and
 * falling back to the announced mock position when geolocation is unavailable.
 */
export function useUserLocation(): UserLocationState {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [locating, setLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [usingMockLocation, setUsingMockLocation] = useState(false)
  const initialized = useRef(false)

  const refreshLocation = useCallback(async () => {
    setLocationError(null)

    // Browsers block geolocation outside secure contexts, so on plain HTTP the
    // only option is a fixed, clearly announced mock position.
    if (usesMockLocation()) {
      setUsingMockLocation(true)
      setCoordinates(MOCK_LOCATION)
      setLocating(false)
      return
    }

    setLocating(true)

    try {
      setCoordinates(await requestAndStoreLocation())
    } catch (error) {
      setLocationError(describeLocationError(error))
    } finally {
      setLocating(false)
    }
  }, [])

  // Reuse the location from the last 24 hours, otherwise ask the browser once.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    if (usesMockLocation()) {
      void refreshLocation()
      return
    }

    const stored = readStoredLocation()

    if (stored) {
      setCoordinates(stored)
      setLocating(false)
      return
    }

    void refreshLocation()
  }, [refreshLocation])

  return {
    coordinates,
    locating,
    locationError,
    usingMockLocation,
    refreshLocation,
  }
}
