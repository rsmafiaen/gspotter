import { formatPrice } from '#/lib/format-price'
import type { SearchResult } from '#/types/search'

function formatTime(iso: string) {
  return iso.slice(11, 16)
}

export function ViewVenue({ venue }: { venue: SearchResult }) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 text-[var(--sea-ink)]">
      <p className="island-kicker">Selected pub</p>
      <h2 className="mt-1 text-xl font-extrabold">{venue.name}</h2>
      <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">{venue.address}</p>
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
              className="flex items-baseline justify-between gap-4 border-t border-[var(--line)] py-2 text-sm"
            >
              <span className="font-semibold">
                {openingHours.days.join(', ')}
              </span>
              <span className="text-[var(--sea-ink-soft)]">
                {formatTime(openingHours.opening)} -{' '}
                {formatTime(openingHours.closing)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          No opening hours listed.
        </p>
      )}
    </article>
  )
}

export default function VenueLoader({ venue }: { venue: SearchResult | null }) {
  // Only venues have a card; a selected city just moves the map.
  if (!venue || venue.type !== 'venue') return null

  return <ViewVenue venue={venue} />
}
