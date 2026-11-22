import { Link } from '@tanstack/react-router'

import { formatOpeningHours } from '#/lib/format-opening-hours'
import { formatPrice } from '#/lib/format-price'
import type { venue } from '#/types/venue'

function latestRegularPrice(current: venue) {
  return (
    current.pricesSighted
      ?.filter((sighting) => sighting.Limitations.length === 0)
      .sort((a, b) => b.timeSighted.localeCompare(a.timeSighted))
      .at(0) ?? null
  )
}

export function VenueTable({ venues }: { venues: venue[] }) {
  if (venues.length === 0) {
    return (
      <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm text-(--sea-ink-soft)">
        No venues have been added yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-(--surface-strong) p-2 text-(--sea-ink)">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-(--line) text-xs font-bold tracking-wide uppercase text-(--sea-ink-soft)">
            <th scope="col" className="px-3 py-2">
              Venue
            </th>
            <th scope="col" className="px-3 py-2">
              City
            </th>
            <th scope="col" className="px-3 py-2">
              Address
            </th>
            <th scope="col" className="px-3 py-2">
              Coordinates
            </th>
            <th scope="col" className="px-3 py-2">
              Opening hours
            </th>
            <th scope="col" className="px-3 py-2">
              Latest price
            </th>
            <th scope="col" className="px-3 py-2">
              Reviews
            </th>
          </tr>
        </thead>
        <tbody>
          {venues.map((current) => {
            const latestPrice = latestRegularPrice(current)

            return (
              <tr
                key={current.id}
                className="border-b border-(--line) last:border-0"
              >
                <th scope="row" className="px-3 py-3 font-bold">
                  <Link
                    to="/$cityId/venues/$venueId"
                    params={{
                      cityId: current.city.id,
                      venueId: current.id,
                    }}
                    className="text-(--lagoon-deep) hover:underline"
                  >
                    {current.name}
                  </Link>
                </th>
                <td className="px-3 py-3">{current.city.name}</td>
                <td className="px-3 py-3 text-(--sea-ink-soft)">
                  {current.address}
                </td>
                <td className="px-3 py-3 font-mono text-xs text-(--sea-ink-soft)">
                  {current.lat.toFixed(5)}, {current.lon.toFixed(5)}
                </td>
                <td className="px-3 py-3 text-(--sea-ink-soft)">
                  {current.openingHours.length > 0
                    ? formatOpeningHours(current.openingHours)
                    : '—'}
                </td>
                <td className="px-3 py-3 text-(--sea-ink-soft)">
                  {latestPrice ? formatPrice(latestPrice) : '—'}
                </td>
                <td className="px-3 py-3 text-(--sea-ink-soft)">
                  {current.reviews.length}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
