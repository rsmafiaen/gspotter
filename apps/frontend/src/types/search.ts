export interface SearchOpeningHours {
  days: string[]
  opening: string
  closing: string
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
  type: 'venue' | 'city'
  name: string
  lat: number
  lon: number
  address: string | null
  openingHours: SearchOpeningHours[] | null
  latestPriceSighting: SearchPriceSighting | null
}
