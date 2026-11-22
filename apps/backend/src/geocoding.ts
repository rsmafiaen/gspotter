import { GraphQLError } from 'graphql'

export interface GeocodingResult {
  lat: number
  lon: number
}

export interface CitySearchResult {
  name: string
  displayName: string
  lat: number
  lon: number
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = process.env.NOMINATIM_USER_AGENT ?? 'T09-Project-2/1.0'
const REQUEST_TIMEOUT_MS = 5000

interface NominatimPlace {
  lat: string
  lon: string
  name?: string
  display_name: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
  }
}

/**
 * Looks up addresses through Nominatim. See
 * https://operations.osmfoundation.org/policies/nominatim/ for the usage
 * policy. In particular, requests should identify the application through the
 * User-Agent header and must not be sent at a high rate.
 */
async function searchNominatim(
  params: URLSearchParams,
): Promise<NominatimPlace[]> {
  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new GraphQLError(`Geocoding failed: ${response.status}`, {
      extensions: { code: 'BAD_GATEWAY' },
    })
  }

  return (await response.json()) as NominatimPlace[]
}

/**
 * Looks up the coordinates for an address using Nominatim. Returns null when
 * the address could not be found.
 */
export async function geocodeAddress(
  address: string,
  city: string,
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    q: `${address}, ${city}`,
    format: 'jsonv2',
    limit: '1',
  })

  const results = await searchNominatim(params)

  if (results.length === 0) return null

  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
  }
}

/**
 * Searches settlements through Nominatim. This is the fallback used by the
 * admin venue form for cities outside the local city table.
 */
export async function searchCities(term: string): Promise<CitySearchResult[]> {
  const params = new URLSearchParams({
    q: term,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '8',
    featureType: 'settlement',
    'accept-language': 'no,en',
  })

  const results = await searchNominatim(params)
  const cities = new Map<string, CitySearchResult>()

  for (const result of results) {
    const lat = Number(result.lat)
    const lon = Number(result.lon)
    const name =
      result.name ??
      result.address?.city ??
      result.address?.town ??
      result.address?.village ??
      result.address?.municipality ??
      result.display_name.split(',')[0]?.trim()

    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) continue

    // Keep same-named places in different regions/countries: the display name
    // includes the administrative context that the short name omits.
    const key = result.display_name.toLocaleLowerCase('nb-NO')

    if (!cities.has(key)) {
      cities.set(key, {
        name,
        displayName: result.display_name,
        lat,
        lon,
      })
    }
  }

  return [...cities.values()]
}
