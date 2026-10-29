export interface Coordinates {
  lat: number
  lon: number
}

const LOCATION_STORAGE_KEY = 'g-spotter:location'
const LOCATION_TTL_MS = 24 * 60 * 60 * 1000

/**
 * Fallback position used when the browser cannot share the user's real one.
 * Geolocation only works in secure contexts, and the deployed site is served
 * over plain HTTP on the NTNU network, so it always falls back to this.
 * NTNU Realfagsbygget, Gløshaugen, Trondheim.
 */
export const MOCK_LOCATION: Coordinates = {
  lat: 63.415458,
  lon: 10.406021,
}

export const MOCK_LOCATION_NAME = 'NTNU Realfagsbygget'

/**
 * True when the page runs in a non-secure context, i.e. plain HTTP on a host
 * other than localhost. `window.isSecureContext` is true for HTTPS as well as
 * for localhost and 127.0.0.1, which are exactly the origins that allow
 * geolocation.
 */
export function usesMockLocation(): boolean {
  if (typeof window === 'undefined') return false

  return !window.isSecureContext
}

interface StoredLocation extends Coordinates {
  savedAt: number
}

export type LocationErrorCode =
  'denied' | 'unavailable' | 'timeout' | 'unsupported'

export class LocationError extends Error {
  code: LocationErrorCode

  constructor(code: LocationErrorCode, message: string) {
    super(message)
    this.name = 'LocationError'
    this.code = code
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function clearStoredLocation() {
  try {
    window.localStorage.removeItem(LOCATION_STORAGE_KEY)
  } catch {
    // Ignore storage failures (for example in private browsing modes).
  }
}

/**
 * Reads the cached coordinates if they are younger than one day.
 * Expired or malformed entries are removed so the next visit asks again.
 */
export function readStoredLocation(now = Date.now()): Coordinates | null {
  if (typeof window === 'undefined') return null

  let raw: string | null
  try {
    raw = window.localStorage.getItem(LOCATION_STORAGE_KEY)
  } catch {
    return null
  }

  if (!raw) return null

  try {
    const stored = JSON.parse(raw) as Partial<StoredLocation>

    if (
      !isFiniteNumber(stored.lat) ||
      !isFiniteNumber(stored.lon) ||
      !isFiniteNumber(stored.savedAt) ||
      now - stored.savedAt >= LOCATION_TTL_MS
    ) {
      clearStoredLocation()
      return null
    }

    return { lat: stored.lat, lon: stored.lon }
  } catch {
    clearStoredLocation()
    return null
  }
}

export function writeStoredLocation(coordinates: Coordinates) {
  if (typeof window === 'undefined') return

  const stored: StoredLocation = { ...coordinates, savedAt: Date.now() }

  try {
    window.localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(stored))
  } catch {
    // The app still works without a cache, it will just ask again next reload.
  }
}

export function requestBrowserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // Browsers only expose geolocation on secure origins (HTTPS or localhost).
    if (usesMockLocation()) {
      reject(
        new LocationError(
          'unsupported',
          'Location needs a secure (HTTPS) connection to work.',
        ),
      )
      return
    }

    // Some embedded browsers and older webviews do not expose geolocation.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(
        new LocationError(
          'unsupported',
          'Your browser does not support location services.',
        ),
      )
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new LocationError(
              'denied',
              'Location permission was denied. Allow it to see pubs near you.',
            ),
          )
        } else if (error.code === error.TIMEOUT) {
          reject(
            new LocationError(
              'timeout',
              'Finding your location took too long. Try again.',
            ),
          )
        } else {
          reject(
            new LocationError(
              'unavailable',
              'Your location is unavailable right now. Try again.',
            ),
          )
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    )
  })
}

/** Requests a fresh position and stores it for the next 24 hours. */
export async function requestAndStoreLocation(): Promise<Coordinates> {
  const coordinates = await requestBrowserLocation()
  writeStoredLocation(coordinates)
  return coordinates
}

export function describeLocationError(error: unknown): string {
  if (error instanceof LocationError) return error.message

  return 'Could not get your location.'
}
