import { Link } from '@tanstack/react-router'

import { HarpIcon } from '#/components/HarpIcon'
import { formatOpeningHours } from '#/lib/format-opening-hours'
import { formatPrice } from '#/lib/format-price'
import { useUserTimeZone } from '#/lib/use-user-time-zone'
import type { SearchResult } from '#/types/search'

export interface NearbyVenuesContentProps {
  venues: SearchResult[]
  hasLocation: boolean
  locating: boolean
  locationError: string | null
  isLoading: boolean
  isError: boolean
  maxDistanceKm?: number | null
}

export const venueRowClassName =
  'block w-full px-1 py-3 text-left text-sm text-(--sea-ink) transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)'

export function nearbyVenuesTitle(
  maxDistanceKm: number | null | undefined = 10,
) {
  return maxDistanceKm == null
    ? 'Pubs near you'
    : `Pubs within ${maxDistanceKm} km`
}

export function NearbyVenueRow({
  venue,
  timeZone,
}: {
  venue: SearchResult
  timeZone: string
}) {
  return (
    <>
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{venue.name}</span>
        {venue.averageRating != null && (
          <span
            title={`Average rating ${venue.averageRating.toFixed(1)} out of 5 from ${
              venue.reviewCount ?? 0
            } ${(venue.reviewCount ?? 0) === 1 ? 'review' : 'reviews'}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-(--sea-ink)"
          >
            <HarpIcon />
            <span>{venue.averageRating.toFixed(1)}</span>
            <span className="font-normal text-(--sea-ink-soft)">
              ({venue.reviewCount ?? 0})
            </span>
          </span>
        )}
      </span>
      {venue.address && (
        <span className="mt-0.5 block text-xs text-(--sea-ink-soft)">
          {venue.address}
        </span>
      )}
      {venue.openingHours && venue.openingHours.length > 0 && (
        <span className="mt-0.5 block text-xs text-(--sea-ink-soft)">
          {formatOpeningHours(venue.openingHours, timeZone)}
        </span>
      )}
      {venue.latestPriceSighting && (
        <span className="mt-0.5 block text-xs text-(--sea-ink-soft)">
          {formatPrice(venue.latestPriceSighting)}
        </span>
      )}
    </>
  )
}

/** The status messages and venue list, without the surrounding card shell. */
export function NearbyVenuesContent({
  venues,
  hasLocation,
  locating,
  locationError,
  isLoading,
  isError,
  maxDistanceKm = 10,
}: NearbyVenuesContentProps) {
  const timeZone = useUserTimeZone()

  return (
    <>
      {locationError && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">{locationError}</p>
      )}

      {!locationError && !hasLocation && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">
          {locating
            ? 'Finding your location…'
            : 'Allow location access to see pubs near you.'}
        </p>
      )}

      {hasLocation && isError && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">
          Nearby pubs are unavailable right now.
        </p>
      )}

      {hasLocation && !isError && isLoading && venues.length === 0 && (
        <p className="mt-3 text-sm text-(--sea-ink-soft)">
          Loading nearby pubs…
        </p>
      )}

      {hasLocation &&
        !isError &&
        !isLoading &&
        venues.length === 0 &&
        !locationError && (
          <p className="mt-3 text-sm text-(--sea-ink-soft)">
            {maxDistanceKm == null
              ? 'No pubs found.'
              : `No pubs within ${maxDistanceKm} km of your location.`}
          </p>
        )}

      {hasLocation && venues.length > 0 && (
        <>
          {venues[0].cityId && venues[0].cityName && (
            <div className="mt-3 flex flex-row flex-wrap items-center gap-3">
              <Link
                to="/$cityId/venues"
                params={{ cityId: venues[0].cityId }}
                className="inline-flex items-center rounded-full bg-(--chip-bg) px-3 py-1.5 font-sans text-sm font-semibold text-(--sea-ink) transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
              >
                Show all venues in {venues[0].cityName}
              </Link>
              <span className="inline-flex items-center font-sans text-sm">
                Not in {venues[0].cityName}? Search for your city in the search
                bar above!
              </span>
            </div>
          )}

          <ul className="striped-list venue-list mt-3">
            {venues.map((venue) => (
              <li key={venue.id}>
                {venue.cityId ? (
                  <Link
                    to="/$cityId/venues/$venueId"
                    params={{ cityId: venue.cityId, venueId: venue.id }}
                    className={venueRowClassName}
                  >
                    <NearbyVenueRow venue={venue} timeZone={timeZone} />
                  </Link>
                ) : (
                  <div className={venueRowClassName}>
                    <NearbyVenueRow venue={venue} timeZone={timeZone} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
