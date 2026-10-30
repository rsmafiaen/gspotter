import {
  formatOpeningDays,
  formatOpeningTime,
} from '#/lib/format-opening-hours'
import { formatPrice } from '#/lib/format-price'
import type { SearchResult } from '#/types/search'

export function ViewVenue({ venue }: { venue: SearchResult }) {
  return (
    <article className="rounded-2xl bg-(--surface-strong) p-5 text-(--sea-ink)">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="mt-1 text-xl font-extrabold">{venue.name}</h2>
        </div>
        {venue.averageRating != null && (
          <p
            title={`Average rating ${venue.averageRating.toFixed(1)} out of 5 from ${
              venue.reviewCount ?? 0
            } ${(venue.reviewCount ?? 0) === 1 ? 'review' : 'reviews'}`}
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold text-(--sea-ink)"
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
              className="flex items-baseline justify-between gap-4 py-2 text-sm"
            >
              <span className="font-semibold">
                {formatOpeningDays(openingHours.days)}
              </span>
              <span className="text-(--sea-ink-soft)">
                {formatOpeningTime(openingHours.opening)} -{' '}
                {formatOpeningTime(openingHours.closing)}
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
