export type GlassSize =
  'PINT' | 'HALF_LITER' | 'QUARTER_LITER' | 'BOX' | 'OTHER'

export interface SearchFilters {
  maxDistanceKm: number | null
  minPrice: string
  maxPrice: string
  sizes: GlassSize[]
  minRating: number | null
}

export interface SearchOpeningHours {
  days: string[]
  opening: string
  closing: string
}

export interface SearchOpeningHoursNote {
  days: string[]
  note: string
}

export interface SearchPriceSighting {
  price: number
  size: string
  sizeMl: number | null
  Limitations: string[]
  timeStart: string | null
  timeEnd: string | null
  timeSighted: string
}

export interface SearchResult {
  id: string
  cityId: string | null
  cityName: string | null
  type: 'venue' | 'city'
  name: string
  lat: number
  lon: number
  distanceKm?: number | null
  address: string | null
  openingHours: SearchOpeningHours[] | null
  openingHoursNotes?: SearchOpeningHoursNote[] | null
  latestPriceSighting: SearchPriceSighting | null
  averageRating?: number | null
  reviewCount?: number
}
