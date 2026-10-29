import { Link } from '@tanstack/react-router'

import { formatOpeningDays } from '#/lib/format-opening-hours'
import { formatPrice } from '#/lib/format-price'
import type { SearchResult } from '#/types/search'

function formatTime(iso: string) {
  return iso.slice(11, 16)
}

export function ViewVenue({
  venue,
  kicker = 'Selected pub',
}: {
  venue: SearchResult
  kicker?: string
}) {
  return (
    <article className="rounded-2xl border border-(--line) bg-(--surface-strong) p-5 text-(--sea-ink)">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="island-kicker">{kicker}</p>
          <h2 className="mt-1 text-xl font-extrabold">{venue.name}</h2>
        </div>
        {venue.averageRating != null && (
          <p
            title={`Average rating ${venue.averageRating.toFixed(1)} out of 5 from ${
              venue.reviewCount ?? 0
            } ${(venue.reviewCount ?? 0) === 1 ? 'review' : 'reviews'}`}
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-(--chip-line) bg-(--chip-bg) px-2.5 py-1 text-sm font-bold text-(--sea-ink)"
          >
            <span>Average rating:</span>
            <span aria-hidden="true" className="text-amber-500">
              ★
            </span>
            <span>{venue.averageRating.toFixed(1)}</span>
            <span className="sr-only">
              out of 5 from {venue.reviewCount ?? 0}{' '}
              {(venue.reviewCount ?? 0) === 1 ? 'review' : 'reviews'}
            </span>
          </p>
        )}
      </div>
      <p className="mt-1 text-sm text-(--sea-ink-soft)">{venue.address}</p>
      {venue.latestPriceSighting && (
        <p className="mt-3 text-sm">
          <span className="font-semibold">Latest price:</span>{' '}
          {formatPrice(venue.latestPriceSighting)}
        </p>
      )}
      <h3 className="mt-4 text-sm font-bold">Opening hours</h3>
      {venue.openingHours && venue.openingHours.length > 0 ? (
        <ul className="mt-1">
          {venue.openingHours.map((openingHours, index) => (
            <li
              key={index}
              className="flex items-baseline justify-between gap-4 border-t border-(--line) py-2 text-sm"
            >
              <span className="font-semibold">
                {formatOpeningDays(openingHours.days)}
              </span>
              <span className="text-(--sea-ink-soft)">
                {formatTime(openingHours.opening)} -{' '}
                {formatTime(openingHours.closing)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-(--sea-ink-soft)">
          No opening hours listed.
        </p>
      )}
    </article>
  )
}

export default function VenueLoader({ venue }: { venue: SearchResult | null }) {
  // Only venues have a card; a selected city just moves the map.
  if (!venue || venue.type !== 'venue') return null

  const card = <ViewVenue venue={venue} />

  if (!venue.cityId) return card

  return (
    <Link
      to="/$cityId/venues/$venueId"
      params={{ cityId: venue.cityId, venueId: venue.id }}
      className="block rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--lagoon-deep)"
    >
      {card}
    </Link>
  )
}
