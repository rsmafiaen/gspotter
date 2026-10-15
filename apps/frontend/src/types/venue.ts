export interface VenueCity {
  id: string
  name: string
  lat: number
  lon: number
}

export interface VenueOpeningHours {
  days: string[]
  opening: string
  closing: string
}

export interface VenuePriceSighting {
  price: number
  size: string
  sizeMl: number | null
  Limitations: string[]
  timeStart: string | null
  timeEnd: string | null
  timeSighted: string
}

export interface venue {
  id: string
  name: string
  address: string
  city: VenueCity
  openingHours: VenueOpeningHours[]
  pricesSighted: VenuePriceSighting[]
}
