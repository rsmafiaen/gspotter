import type {
  SearchOpeningHours,
  SearchPriceSighting,
  SearchResult,
} from '#/types/search'
import type { VenueReview, venue } from '#/types/venue'

export function makeOpeningHours(
  overrides: Partial<SearchOpeningHours> = {},
): SearchOpeningHours {
  return {
    days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    opening: '2026-10-01T14:00:00.000Z',
    closing: '2026-10-02T02:00:00.000Z',
    ...overrides,
  }
}

export function makePriceSighting(
  overrides: Partial<SearchPriceSighting> = {},
): SearchPriceSighting {
  return {
    price: 89,
    size: 'PINT',
    sizeMl: 500,
    Limitations: [],
    timeStart: null,
    timeEnd: null,
    timeSighted: '2026-10-01T12:00:00.000Z',
    ...overrides,
  }
}

export function makeSearchResult(
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    id: 'venue-1',
    cityId: 'trondheim',
    type: 'venue',
    name: 'Studentersamfundet',
    lat: 63.4228,
    lon: 10.3957,
    address: 'Elgeseter gate 1',
    openingHours: [makeOpeningHours()],
    openingHoursNotes: [],
    latestPriceSighting: makePriceSighting(),
    averageRating: 4.5,
    reviewCount: 2,
    ...overrides,
  }
}

export function makeReview(overrides: Partial<VenueReview> = {}): VenueReview {
  return {
    id: 'review-1',
    username: 'Kari',
    body: 'Great atmosphere and cheap beer.',
    rating: 5,
    timeCreated: '2026-10-01T12:00:00.000Z',
    ...overrides,
  }
}

export function makeVenue(overrides: Partial<venue> = {}): venue {
  return {
    id: 'venue-1',
    name: 'Studentersamfundet',
    address: 'Elgeseter gate 1',
    lat: 63.4228,
    lon: 10.3957,
    city: {
      id: 'trondheim',
      name: 'Trondheim',
      lat: 63.4305,
      lon: 10.3951,
    },
    openingHours: [makeOpeningHours()],
    openingHoursNotes: [],
    pricesSighted: [makePriceSighting()],
    reviews: [makeReview()],
    ...overrides,
  }
}
