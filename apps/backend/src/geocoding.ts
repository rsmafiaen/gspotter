import { GraphQLError } from 'graphql'

export interface GeocodingResult {
  lat: number
  lon: number
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = process.env.NOMINATIM_USER_AGENT ?? 'T09-Project-2/1.0'

/**
 * Looks up the coordinates for a Norwegian address using Nominatim.
 * Returns null when the address could not be found.
 *
 * See https://operations.osmfoundation.org/policies/nominatim/ for the usage
 * policy. In particular, requests should identify the application through the
 * User-Agent header and must not be sent at a high rate.
 */
export async function geocodeAddress(
  address: string,
  city: string,
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    q: `${address}, ${city}`,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'no',
  })

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    throw new GraphQLError(`Geocoding failed: ${response.status}`, {
      extensions: { code: 'BAD_GATEWAY' },
    })
  }

  const results = (await response.json()) as GeocodingResult[]

  if (results.length === 0) return null

  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
  }
}
