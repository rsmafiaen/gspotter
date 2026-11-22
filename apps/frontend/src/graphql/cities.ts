export const CITY_SEARCH = `
  query CitySearch($name: String!) {
    city(name: $name) {
      id
      name
      displayName
      lat
      lon
    }
  }
`

/** Nominatim-backed search used alongside the database results. */
export const CITY_PLACE_SEARCH = `
  query CityPlaceSearch($name: String!) {
    cityPlaceSearch(name: $name) {
      name
      displayName
      lat
      lon
    }
  }
`

export const FIND_OR_CREATE_CITY = `
  mutation FindOrCreateCity($input: MutationFindOrCreateCityInput!) {
    findOrCreateCity(input: $input) {
      id
      name
      displayName
      lat
      lon
    }
  }
`
