import { Link } from '@tanstack/react-router'

import type { SearchResult } from '#/types/search'
import type { venue } from '#/types/venue'

import { ViewVenue } from './ViewVenue'

export function venueToSearchResult(current: venue): SearchResult {
  const ratings = current.reviews.map((review) => review.rating)
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
      : null

  return {
    id: current.id,
    cityId: current.city.id,
    cityName: current.city.name,
    type: 'venue',
    name: current.name,
    lat: current.lat,
    lon: current.lon,
    address: current.address,
    openingHours: current.openingHours,
    openingHoursNotes: current.openingHoursNotes,
    latestPriceSighting:
      current.pricesSighted
        ?.filter((sighting) => sighting.Limitations.length === 0)
        .sort((a, b) => b.timeSighted.localeCompare(a.timeSighted))[0] ?? null,
    averageRating,
    reviewCount: ratings.length,
  }
}

export default function VenueCard({ current }: { current: venue }) {
  return (
    <Link
      to="/$cityId/venues/$venueId"
      params={{ cityId: current.city.id, venueId: current.id }}
      className="block rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--lagoon-deep)"
    >
      <ViewVenue venue={venueToSearchResult(current)} />
    </Link>
  )
}
