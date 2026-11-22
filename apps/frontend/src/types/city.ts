export interface City {
  id: string
  name: string
  displayName?: string | null
  lat: number
  lon: number
}

export interface CityPlace {
  name: string
  displayName: string
  lat: number
  lon: number
}
